const fs = require('fs')
const resolveResource = require('@antora/content-classifier/lib/util/resolve-resource')

module.exports.register = function ({ config }) {
  const logger = this.getLogger('@outscale/antora-extension')

  this.once('contentAggregated', ({ contentAggregate }) => {
    for (let i = 0, length = contentAggregate.length; i < length; i++) {
      const files = contentAggregate[i].files
      for (let j = 0, length = files.length; j < length; j++) {
        if (files[j].stem) (files[j].stem = files[j].stem.normalize('NFC'))
        if (files[j].extname === '.adoc') files[j].contents = modifyAsciiDoc(files[j])
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
    localize404Page('404', playbook)
  })
}

function modifyAsciiDoc (file) {
  let text = file.contents.toString()

  text = text.normalize('NFC')

  text = disambiguateTabIds(/\[\.tab, id="\{cockpit-1\}"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="\{cockpit-2\}"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="OSC CLI"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="AWS CLI"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="Linux"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="macOS"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="Windows"\]/g, text)

  if (~file.dirname.indexOf('/pages')) {
    if (~text.indexOf('AWS')) text += '\n\n[#aws-disclaimer]\n{page-awsdisclaimer-text}\n'
  }

  return Buffer.from(text)
}

function disambiguateTabIds (re, text) {
  const m = text.match(re)
  if (m && m.length > 1) {
    for (let i = 0, length = m.length; i < length; i++) {
      const repl = m[i].replace('"]', '_' + i + '"]')
      text = text.replace(m[i], repl)
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

function moveJsFileToSubdir (filename, playbook) {
  const oldPath = playbook.output.dir + '/' + filename
  const newPath = playbook.output.dir + '/' + playbook.ui.outputDir + '/js/' + filename
  if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath)
}

function localize404Page (filename, playbook) {
  // Quick solution, to be improved
  const oldPath = playbook.output.dir + '/' + filename + '.html'
  const enPath = playbook.output.dir + '/' + filename + '-en.html'
  const frPath = playbook.output.dir + '/' + filename + '-fr.html'
  if (fs.existsSync(oldPath)) {
    fs.copyFileSync(oldPath, enPath)
    fs.copyFileSync(enPath, frPath)
  }
}
