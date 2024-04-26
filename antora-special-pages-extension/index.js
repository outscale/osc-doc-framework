const cheerio = require('cheerio')
const fs = require('fs')
const ospath = require('path')

const specialPagesNames = []

module.exports.register = function () {
  let config = {}
  let searchEnabled

  this.on('playbookBuilt', async ({ playbook }) => {
    searchEnabled = isSearchEnabled(playbook.antora.extensions)
  })

  this.on('uiLoaded', async ({ uiCatalog, playbook }) => {
    if (searchEnabled) {
      addJsFile('search-page.js', uiCatalog, playbook.ui.outputDir)
    }
  })

  this.once('contentAggregated', ({ playbook, contentAggregate }) => {
    for (let i = 0, length = contentAggregate.length; i < length; i++) {
      const componentName = contentAggregate[i].name
      const specialPagesExtension = contentAggregate[i].ext?.specialPagesExtension
      config[componentName] = getConfig(playbook, componentName, specialPagesExtension, searchEnabled)
    }
  })

  this.once('contentClassified', ({ playbook, contentCatalog }) => {
    const components = contentCatalog.getComponents().filter((n) => n.name !== 'ROOT')
    for (let i = 0, length = components.length; i < length; i++) {
      const versions = components[i].versions
      for (let j = 0, length = versions.length; j < length; j++) {
        createSpecialPage('notFoundPage', contentCatalog, versions[j], config[versions[j].name])
        if (searchEnabled) {
          createSpecialPage('searchPage', contentCatalog, versions[j], config[versions[j].name])
          createOpenSearchFile(contentCatalog, versions[j], config[versions[j].name], playbook)
        }
      }
    }
  })

  this.on('sitePublished', ({ siteCatalog, contentCatalog, playbook }) => {
    fs.unlinkSync(playbook.output.dir + '/' + '404.html')
    for (let i = 0, length = specialPagesNames.length; i < length; i++) {
      if (specialPagesNames[i].startsWith('404')) {
        const file = contentCatalog.findBy({family: 'page', basename: specialPagesNames[i] + '.adoc'})[0]
        if (file) {
          const oldPath = playbook.output.dir + '/' + file.out.path
          const newPath = playbook.output.dir + '/' + file.out.basename
          if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath)
          let text = fs.readFileSync(newPath, { encoding: 'utf8' })
          text = text.replace(/"\.\.\/\.\.\//g, '"')
          fs.writeFileSync(newPath, text)
        }
      }
    }
    const files = siteCatalog.getFiles()
    for (let i = 0, length = files.length; i < length; i++) {
      const path = files[i].pub?.url
      if (path?.startsWith('/sitemap-')) {
        removeSpecialPagesFromSitemaps(path, playbook)
      }
    }
  })

}

function isSearchEnabled(extensions) {
  const array = extensions.filter((n) => n.require.endsWith('@antora/lunr-extension') && n.enabled)

  return array.length > 0
}

function addJsFile (filename, uiCatalog, uiOutputDir) {
  uiCatalog.addFile({
    contents: fs.readFileSync(ospath.join(__dirname, 'data/js/' + filename)),
    out: { path: uiOutputDir + '/js/' + filename},
  })
}

function getConfig (playbook, componentName, config={}, searchEnabled) {
  config.module = config.module || 'userguide'

  const cnfp = config.notFoundPage || {}

  if (componentName === 'fr') {
    config.notFoundPage = {
      name: cnfp.name || '404-fr',
      content: cnfp.content || (
        '= Page introuvable\n'
        + ':page-layout: 404\n\n'
        + '[discrete]\n'
        + "=== Nous avons cherché partout, mais nous n'avons pas trouvé votre page.\n\n"
        + "link:{page-component-name}/{page-module}/Accueil.html[Retour à l'Accueil, role=action-button]"
      ),
    }
  }
  else {
    config.notFoundPage = {
      name: cnfp.name || '404-en',
      content: cnfp.content || (
        '= Page Not Found\n'
        + ':page-layout: 404\n\n'
        + '[discrete]\n'
        + '=== We looked everywhere, but we could not find your page.\n\n'
        + 'link:{page-component-name}/{page-module}/Home.html[Back to Home, role=action-button]'
      ),
    }
  }

  if (searchEnabled) {
    const uiOutputDir = playbook.ui.outputDir
    const csp = config.searchPage || {}
    const cos = config.openSearch || {}

    if (componentName === 'fr') {
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
  }

  return config
}

function createSpecialPage (page, contentCatalog, component, config) {
  specialPagesNames.push(config[page].name)

  contentCatalog.addFile({
    contents: Buffer.from(config[page].content),
    path: 'modules/' + config.module + '/pages/' + config[page].name + '.adoc',
    src: {
      component: component.name,
      version: component.version,
      module: config.module,
      family: 'page',
      relative: config[page].name + '.adoc',
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

function removeSpecialPagesFromSitemaps (path, playbook) {
  const outputDir = playbook.output.dir

  for (let i = 0, length = specialPagesNames.length; i < length; i++) {
    const outputPath = outputDir + path
    const data = cheerio.load(fs.readFileSync(outputPath), {xmlMode: true})
    data('url:contains("/' + specialPagesNames[i] + '.html")').remove()
    fs.writeFileSync(outputPath, data.xml())
  }
}

function moveFileToRoot (filename, playbook) {
  const oldPath = playbook.output.dir + '/' + filename
  const newPath = playbook.output.dir + '/' + playbook.ui.outputDir + '/js/' + filename
  if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath)
}
