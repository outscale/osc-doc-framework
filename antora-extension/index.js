const fs = require('fs')

module.exports.register = function ({ config }) {
  this.once('beforeProcess', () => {
    try {
      require('mac-ca')
    }
    catch (e) {}
  })

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

  this.once('sitePublished', ({ playbook }) => {
    moveJsFileToSubdir('search-index.js', playbook)
    moveJsFileToSubdir('site-navigation-data.js', playbook)
  })
}

function modifyAsciiDoc (file) {
  let text = file.contents.toString()

  text = text.normalize('NFC')

  text = disambiguateTabIds(/\[\.tab, id="\{cockpit-1\}"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="\{cockpit-2\}"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="OSC CLI"\]/g, text)
  text = disambiguateTabIds(/\[\.tab, id="AWS CLI"\]/g, text)

  if (~file.dirname.indexOf('/pages')) {
    text = text.replace(/(\n:page-\w\w:.+)\.adoc(\n)/, '$1$2')
    if (~text.indexOf('AWS')) text += '\n[#aws-disclaimer]\n{page-awsdisclaimer-text}\n'
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

function moveJsFileToSubdir (filename, playbook) {
  const oldPath = playbook.output.dir + '/' + filename
  const newPath = playbook.output.dir + '/' + playbook.ui.outputDir + '/js/' + filename
  if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath)
}
