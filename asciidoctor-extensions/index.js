const TAB_IDS_TO_DISAMBIGUATE = ['\{cockpit-2\}', 'OSC CLI', 'AWS CLI', 'Linux', 'macOS', 'Windows']
const EXTERNAL_LINKS = new RegExp('(<a href="(?:http|file).+?")(?: class="bare")?>', 'g')

module.exports = function (registry) {
  registry.preprocessor(function () {
    const self = this
    self.process(function (doc, reader) {
      let text = reader.source_lines.join('\n')

      text = text.normalize('NFC')
      text = disambiguateTabIds(TAB_IDS_TO_DISAMBIGUATE, text)
      text = addAwsDisclaimer(reader.dir, text)

      reader.lines = text.split('\n').reverse()
      return reader
    })
  })

  registry.postprocessor(function () {
    const self = this
    self.process(function (doc, output) {
      return output.replace(EXTERNAL_LINKS, '$1 target="_blank" rel="noopener">')
    })
  })
}

function disambiguateTabIds (ids, text) {
  for (const id of ids) {
    const re = new RegExp('\\[\\.tab, id="' + id + '"\\]', 'g')
    const m = text.match(re)
    if (m?.length > 1) {
      for (let i = 0, length = m.length; i < length; i++) {
        text = text.replace(m[i], (s) => {return s.replace('"]', '_' + i + '"]')})
      }
    }
  }
  return text
}

function addAwsDisclaimer (dir, text) {
  if (~dir.indexOf('/pages')) {
    if (~text.indexOf('AWS')) text += '\n\n[#aws-disclaimer]\n{page-awsdisclaimer-text}\n'
  }

  return text
}
