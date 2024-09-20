const checkUpdate = require('./lib/update-checker')
const fs = require('fs')
const resolveResource = require('@antora/content-classifier/lib/util/resolve-resource')

module.exports.register = function ({ config }) {
  const logger = this.getLogger('@outscale/antora-extension')

  this.once('contextStarted', () => {
    if (!process.env.CI && config.updateChecker === true) checkUpdate()
  })

  this.once('contentAggregated', ({ contentAggregate }) => {
    for (let i = 0, length = contentAggregate.length; i < length; i++) {
      const files = contentAggregate[i].files
      for (let j = 0, length = files.length; j < length; j++) {
        if (files[j].stem) (files[j].stem = files[j].stem.normalize('NFC'))
      }
    }
  })

  this.once('contentClassified', ({ contentCatalog }) => {
    const files = contentCatalog.getFiles()
    for (let j = 0, length = files.length; j < length; j++) {
      if (files[j].out) files[j].out.path = files[j].out.path.normalize('NFC')
      if (files[j].url) files[j].pub.url = files[j].pub.url.normalize('NFC')
    }
  })

  this.once('documentsConverted', ({ contentCatalog }) => {
    const files = contentCatalog.getFiles()
    for (let j = 0, length = files.length; j < length; j++) {
      checkOtherLanguageLink(files[j], contentCatalog, logger)
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
