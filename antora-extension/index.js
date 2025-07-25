const checkUpdate = require('./lib/update-checker')
const fs = require('fs')
const path = require('path')
const resolveResource = require('@antora/content-classifier/lib/util/resolve-resource')

module.exports.register = function ({ config }) {
  const logger = this.getLogger('@outscale/antora-extension')
  const compConfig = {}

  this.once('contextStarted', async () => {
    if (!process.env.CI && config.updateChecker === true) {
      if (await checkUpdate()) process.exit(1)
    }
  })

  this.once('contentAggregated', ({ playbook, contentAggregate }) => {
    const tempDir = path.dirname(playbook.output.dir) + '/.tmp'
    fs.rmSync(tempDir, { recursive: true, force: true })
    for (let i = 0, length = contentAggregate.length; i < length; i++) {
      const files = contentAggregate[i].files
      const origins = contentAggregate[i].origins
      for (let j = 0, length = origins.length; j < length; j++) {
        contentAggregate[i].origins[j] = processApiContentBuildOptions(origins[j], files, tempDir)
      }
      const componentName = contentAggregate[i].name
      compConfig[componentName] = contentAggregate[i].ext?.antoraExtension || {}
      if (Object.keys(compConfig.ROOT || {}).length === 0) {
        compConfig.ROOT = compConfig.en || {}
      }
      for (let j = 0, length = files.length; j < length; j++) {
        if (files[j].stem) {
          files[j].stem = files[j].stem.normalize('NFC')
        }
      }
    }
  })

  this.once('contentClassified', ({ contentCatalog }) => {
    const files = contentCatalog.getFiles()
    for (let j = 0, length = files.length; j < length; j++) {
      if (files[j].out) files[j].out.path = files[j].out.path.normalize('NFC')
      if (files[j].url) files[j].pub.url = files[j].pub.url.normalize('NFC')
      if (files[j].src.mediaType === 'text/asciidoc' && files[j].contents) {
        files[j].contents = modifyAsciiDoc(files[j])
      }
    }
  })

  this.once('documentsConverted', ({ contentCatalog }) => {
    const pages = contentCatalog.getPages()
    for (let j = 0, length = pages.length; j < length; j++) {
      checkOtherLanguageLink(pages[j], contentCatalog, logger)
      const componentName = pages[j].src.component
      pages[j].contents = modifyHtml(pages[j], compConfig[componentName])
    }
  })

  this.once('sitePublished', ({ playbook }) => {
    moveJsFileToSubdir('search-index.js', playbook)
    moveJsFileToSubdir('site-navigation-data.js', playbook)
    const outputDir = playbook.output.dir
    addQueryParamToRedirect(outputDir + '/en/userguide/Cockpit-Release-Notes.html', '?f=Cockpit')
    addQueryParamToRedirect(outputDir + '/fr/userguide/Notes-de-releases-Cockpit.html', '?f=Cockpit')
    addQueryParamToRedirect(outputDir + '/en/userguide/OUTSCALE-Marketplace-Release-Notes.html', '?f=Marketplace')
    addQueryParamToRedirect(outputDir + '/fr/userguide/Notes-de-releases-OUTSCALE-Marketplace.html', '?f=Marketplace')
    updateRobotsTxt('robots.txt', playbook)
  })
}

function processApiContentBuildOptions (origin, files, tempDir) {
  if (origin.descriptor.ext?.buildOptions) {
    origin.descriptor.ext.source = origin.url.split('/').pop().split('.git')[0]
    origin.descriptor.ext.buildOptions = setFileTempPaths(
      files, origin.descriptor.ext.buildOptions, tempDir, origin.descriptor.ext.source
    )
    const collector = {
      run: {
        command: '$NODE node_modules/@outscale/osc-doc-framework/antora-extension/lib/apidocs.js',
        dir: process.cwd(),
        env: [{ name: 'APIDOC', value: JSON.stringify(origin.descriptor.ext) }]
      },
      scan: {
        dir: process.cwd() + '/' + tempDir,
      },
      clean: true,
    }
    if (origin.descriptor.ext.collector) {
      origin.descriptor.ext.collector.push(collector)
    } else {
      origin.descriptor.ext.collector = [collector]
    }
  }

  return origin
}

function setFileTempPaths (files, buildOptions, tempDir, source) {
  buildOptions.outputDir = tempDir
  const keys = Object.keys(buildOptions).filter((k) => k.endsWith('File'))
  for (let key of keys) {
    const file = files.filter((n) => n.path === buildOptions[key])[0]
    if (file) {
      fs.mkdirSync(tempDir + '/' + source, { recursive: true })
      fs.writeFileSync(tempDir + '/' + source + '/' + buildOptions[key], file.contents.toString())
    }
    buildOptions[key] = tempDir + '/' + source + '/' + buildOptions[key]
  }

  return buildOptions
}

function modifyAsciiDoc (file) {
  let text = file.contents.toString()
  text = disambiguateTabIds(text)
  text = text.normalize('NFC')

  return Buffer.from(text)
}

function disambiguateTabIds (text) {
  const m = text.match(/\[\.tab, id=".+?"\]/g)
  if (m?.length > 1) {
    for (let i = 0, length = m.length; i < length; i++) {
      text = text.replace(m[i], (s) => {return s.replace('"]', '_' + i + '"]')})
    }
  }

  return text
}

function checkOtherLanguageLink (file, contentCatalog, logger) {
  const lang = file.src.component
  let otherLang = 'fr'
  if (lang === 'fr') otherLang = 'en'
  const otherLangPage = file.asciidoc?.attributes['page-' + otherLang]
  const resolve = resolveResource(`${otherLang}:${file.src.module}:${otherLangPage}`, contentCatalog)
  if (otherLangPage) {
    if (resolve) file.asciidoc.attributes['page-' + otherLang] = resolve.out.basename
    else {
      logger.error(`target of "page-${otherLang}" not found: ${otherLangPage}`)
      console.log(`    file: ${lang}/${file.path}\n`)
    }
  }
}

function modifyHtml (page, compCfg) {
  let text = page.contents.toString()
  if (compCfg.disclaimerTrigger && ~text.indexOf(compCfg.disclaimerTrigger)) {
    text += '\n<div id="disclaimer" class="paragraph page-wrapper api">\n<p>' + compCfg.disclaimerText + '</p>\n</div>'
  }
  text = text.replace(/(<a href="(?:http|file).+?")(?: class="bare")?>/g, '$1 target="_blank" rel="noopener">')
  text = text.normalize('NFC')

  return Buffer.from(text)
}

function moveJsFileToSubdir (filename, playbook) {
  const oldPath = playbook.output.dir + '/' + filename
  const newPath = playbook.output.dir + '/' + playbook.ui.outputDir + '/js/' + filename
  if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath)
}

function addQueryParamToRedirect (filename, queryParam) {
  if (fs.existsSync(filename)) {
    let text = fs.readFileSync(filename, 'utf-8')
    text = text.replace(/(?<=(location=|url=|<a href=)(.+?)\.html)/g, queryParam)
    fs.writeFileSync(filename, text)
  }
}

function updateRobotsTxt (filename, playbook) {
  const path = playbook.output.dir + '/' + filename
  if (fs.existsSync(path)) {
    const text = fs.readFileSync(path, 'utf-8')
    fs.writeFileSync(path, text + '\nSitemap: ' + playbook.site.url + '/sitemap.xml\n')
  }
}
