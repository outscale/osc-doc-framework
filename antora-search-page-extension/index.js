const cheerio = require('cheerio')
const fs = require('fs')
const ospath = require('path')

const searchPageNames = []

module.exports.register = function () {
  let config = {}

  this.on('uiLoaded', async ({ uiCatalog, playbook }) => {
    addJsFile(uiCatalog, playbook.ui.outputDir)
  })

  this.once('contentAggregated', ({ playbook, contentAggregate }) => {
    for (let i = 0, length = contentAggregate.length; i < length; i++) {
      const componentName = contentAggregate[i].name
      config[componentName] = getConfig(playbook, componentName, contentAggregate[i].ext?.searchPageExtension)
    }
  })

  this.once('contentClassified', ({ contentCatalog, playbook }) => {
    const components = contentCatalog.getComponents()
    for (let i = 0, length = components.length; i < length; i++) {
      const versions = components[i].versions
      for (let j = 0, length = versions.length; j < length; j++) {
        if (config[versions[j].name].enabled) {
          createSearchPage(contentCatalog, versions[j], config[versions[j].name])
          createOpenSearchFile(contentCatalog, versions[j], config[versions[j].name], playbook)
        }
      }
    }
  })

  this.on('sitePublished', ({ siteCatalog, playbook }) => {
    const files = siteCatalog.getFiles()
    for (let i = 0, length = files.length; i < length; i++) {
      const path = files[i].pub?.url
      if (path?.startsWith('/sitemap-')) {
        removeSearchPageFromSitemaps(path, playbook)
      }
    }
  })

}

function addJsFile (uiCatalog, uiOutputDir) {
  uiCatalog.addFile({
    contents: fs.readFileSync(ospath.join(__dirname, 'data/js/search-page.js')),
    out: { path: uiOutputDir + '/js/search-page.js'},
  })
}

function getConfig (playbook, componentName, config={}) {
  const uiOutputDir = playbook.ui.outputDir
  const csp = config.searchPage || {}
  const cos = config.openSearch || {}

  if (componentName === 'fr') {
    config.module = config.module || 'userguide'
    config.searchPage = {
      name: csp.name || 'Recherche',
      content: csp.content || '= Résultats de la recherche :\n:page-en: Search.adoc\n:page-role: search',
    }
    config.openSearch = {
      shortName: cos.shortName || 'OUTSCALE Docs FR',
      description: cos.description || 'Rechercher dans la Documentation publique OUTSCALE',
      image: cos.image || uiOutputDir + '/img/favicon.ico',
      selfTemplate: cos.selfUrl || config.module + '/_xml/opensearch.xml',
      searchTemplate: cos.searchTemplate || config.module + '/' + config.searchPage.name + '.html?q={searchTerms}',
      searchForm: cos.searchForm || config.module + '/' + config.searchPage.name + '.html',
    }
  }
  else {
    config.module = config.module || 'userguide'
    config.searchPage = {
      name: csp.name || 'Search',
      content: csp.content || '= Search Results:\n:page-fr: Recherche.adoc\n:page-role: search',
    }
    config.openSearch = {
      shortName: cos.shortName || 'OUTSCALE Docs EN',
      description: cos.description || 'Search the OUTSCALE Public Documentation',
      image: cos.image || uiOutputDir + '/img/favicon.ico',
      selfTemplate: cos.selfUrl || config.module + '/_xml/opensearch.xml',
      searchTemplate: cos.searchTemplate || config.module + '/' + config.searchPage.name + '.html?q={searchTerms}',
      searchForm: cos.searchForm || config.module + '/' + config.searchPage.name + '.html',
    }
  }

  return config
}

function createSearchPage (contentCatalog, component, config) {
  searchPageNames.push(config.searchPage.name)

  contentCatalog.addFile({
    contents: Buffer.from(config.searchPage.content),
    path: 'modules/' + config.module + '/pages/' + config.searchPage.name + '.adoc',
    src: {
      component: component.name,
      version: component.version,
      module: config.module,
      family: 'page',
      relative: config.searchPage.name + '.adoc',
    },
  })
}

function createOpenSearchFile (contentCatalog, component, config, playbook) {
  const siteUrl = playbook.site.url
  const shortName = config.openSearch.shortName
  const description = config.openSearch.description
  const image = siteUrl + '/' + config.openSearch.image
  
  let version = ''
  if (component.version) version = component.version + '/'

  const selfTemplate = siteUrl + '/' + component.name + '/' + version + config.openSearch.selfTemplate
  const searchTemplate = siteUrl + '/' + component.name + '/' + version + config.openSearch.searchTemplate
  const searchForm = siteUrl + '/' + component.name + '/' + version + config.openSearch.searchForm

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>${shortName}</ShortName>
  <Description>${description}</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/x-icon">${image}</Image>
  <Url type="application/opensearchdescription+xml" rel="self" template="${selfTemplate}"/>
  <Url type="text/html" template="${searchTemplate}"/>
  <moz:SearchForm>${searchForm}</moz:SearchForm>
</OpenSearchDescription>
`
  contentCatalog.addFile({
    contents: Buffer.from(content),
    path: 'modules/' + config.module + '/attachments/opensearch.xml',
    src: {
      component: component.name,
      version: component.version,
      module: config.module,
      family: 'attachment',
      relative: 'opensearch.xml',
    },
    out: {
      path: component.name + '/' + component.version + '/' + config.module + '/_xml/opensearch.xml',
    }
  })
}

function removeSearchPageFromSitemaps (path, playbook) {
  const outputDir = playbook.output.dir

  for (let i = 0, length = searchPageNames.length; i < length; i++) {
    const outputPath = outputDir + path
    const data = cheerio.load(fs.readFileSync(outputPath), {xmlMode: true})
    data('url:contains("/' + searchPageNames[i] + '.html")').remove()
    fs.writeFileSync(outputPath, data.xml())
  }
}
