const fs = require('fs')

function generateOctlPartials (apiMarkdown, octlPrefix, octlDirDocsReference, outputFolder, outputFileStem) {
  const files = fs.readdirSync(octlDirDocsReference)
  for (const file of files) {
    const stem = file.replace('.md', '')
    const filenameParts = stem.split('_')
    if (filenameParts.length === 4 && filenameParts[2] === 'api' && filenameParts[1] === octlPrefix) {
      const service = filenameParts[1]
      const call = filenameParts[3]
      const octlText = fs.readFileSync(octlDirDocsReference + '/' + file, 'utf-8')
      const apidocText = getApidocSection(apiMarkdown, call)

      const mainDescription = getMainDescription(apidocText, call)
      const requestSample = getRequestSample(apidocText, service, call)
      const options = getOptions(octlText, apidocText, service)
      const resultElementsAndResultSample = getResultElementsAndResultSample(apidocText, call)

      let s = [
        markdown_to_asciidoc(mainDescription, outputFileStem),
        markdown_to_asciidoc(requestSample, outputFileStem),
        markdown_to_asciidoc(options, outputFileStem),
        markdown_to_asciidoc(resultElementsAndResultSample, outputFileStem),
      ].join('\n') + '\n'

      fs.mkdirSync(outputFolder, { recursive: true })
      fs.writeFileSync(`${process.cwd()}/${outputFolder}/_RC-octl-${filenameParts[1]}-api-${call}.adoc`, s)
    }
  }
}

function getApidocSection (apiMarkdown, call) {
  const start = '\n## ' + call + '\n'
  const end = '\n## '

  return split(apiMarkdown, start, end)
}

function getMainDescription (apidocText, call) {
  const start = '`\n\n'
  const end = '\n<aside class="warning">'
  const altEnd = '\n<aside class="success">'

  let description = split(apidocText, start, end, altEnd)

  const match = description.match(/^> \[WARNING\]<br \/>\n(> .*?\n\n?)+?(?=[^>])/)
  if (match) {
    const warning = match[0]
    const desc_no_warning = description.slice(warning.length)
    description = warning
    description += 'The **' + call + '** command ' + desc_no_warning[0].toLowerCase() + desc_no_warning.slice(1)
  } else {
    description = 'The **' + call + '** command ' + description[0].toLowerCase() + description.slice(1)
  }

  return '// tag::main-description[]\n\n' + description + '// end::main-description[]\n\n\n'
}

function getRequestSample (apidocText, service, call) {
  let s = '// tag::examples[]\n\n'

  let i = 0
  const matches = apidocText.matchAll(/```shell--octl\n[\s\S]+?(?=```)/g)
  for (m of matches) {
    m[0] = m[0].replaceAll(/# For more information, see .+?octl.+?\n\n/g, '')
    m[0] = m[0].replaceAll(/(?<=^|\n)octl/g, '$ octl')
    m[0] = m[0].replaceAll('&lt', '<').replaceAll('&gt', '>')
    i++
    const summary = m[0].match(/#+? .+?\n/g)
    if (summary) {
      s += '// tag::example_' + i + '[] ' + '\n'
      s += '.Request sample: ' + summary[0].replace(/^# +?/, '') + m[0].replace(summary[0] + '\n', '').trimEnd() + '\n```\n'
    } else {
      s += '// tag::example_' + i + '[]' + '\n\n'
      s += '.Request sample\n' + m[0].trimEnd() + '\n```\n'
    }
    s += '// end::example_' + i + '[]\n\n'
  }

  s += '// end::examples[]\n\n'

  return s
}

function getOptions (octlText, apidocText, service) {
  let s = '// tag::request-parameters[]\n\n'

  const octlStart = '\n### Options\n'
  const octlEnd = '\n### Options inherited'
  let octlPart = split(octlText, octlStart, octlEnd)

  const apidocStart = '>Request Parameters</h3>\n'
  const apidocEnd = '>Response Elements</h3>\n'
  const apidocPart = split(apidocText, apidocStart, apidocEnd)

  let i = 0
  const matches = octlPart.matchAll(/\n      --(?<option>.+?)(?<type>(?: \S+?)?)\b   +(?<description>.*)/g)
  for (const m of matches) {
    i++
    let option = m.groups.option
    let regStart = `\n\\|(?:.+? )?`
    if (option.includes('.')) {
      option = option.split('.').pop()
      regStart = `\n\\|.+? `
    }
    if (service === 'kube') {
      option = pascalcase_to_snakecase(option)
    }
    const regEnd =`( .+?)?\\|.+?\\|(.+?)\\|\n`
    const reg1 = new RegExp(regStart + option + regEnd)
    const reg2 = new RegExp(regStart + option.replaceAll('_', '-') + regEnd)
    const apidocPartMatch = apidocPart.match(reg1) || apidocPart.match(reg2)
    let required = ''
    let description = ''
    if (!apidocPartMatch || (apidocPartMatch && !apidocPartMatch[1])) {
      required = '(optional) '
    }
    if (apidocPartMatch) {
      description = required + apidocPartMatch[2]
    } else {
      description = required + m.groups.description
    }
    s += '// tag::' + m.groups.option + '[]\n'
    s += '* `' + m.groups.option + '`: ' + description + '\n'
    s += '// end::' + m.groups.option + '[]\n'
  }

  if (i === 1) {
    s = '\nThis command contains the following option that you need to specify:\n\n' + s + '\n'
  } else if (i > 1) {
    s = '\nThis command contains the following options that you need to specify:\n\n' + s + '\n'
  }

  s += '// end::request-parameters[]\n\n'

  return s
}

function getResultElementsAndResultSample (apidocText, call) {
  let s = ''

  const apidocStart = '>Response Elements</h3>\n'
  const apidocEnd = '\n## '
  const apidocAltEnd = '\n# Schemas'
  const apidocPart = split(apidocText, apidocStart, apidocEnd, apidocAltEnd)

  // Result elements
  let i = 0
  let matches = apidocPart.matchAll(/\n\|(?:(?<indent>\W+?) )?(?<element>.+?)(?: .+?)?\|.+?\|(?<description>.+)\|/g)
  for (const m of matches) {
    i++
    if (i > 2) {
      let element
      if (m.groups.element.includes('----Deprecated----')) {
        element = '`' + m.groups.element.replace('----Deprecated----', '') + '` (deprecated)'
      } else {
        element = '`' + m.groups.element + '`'
      }
      s += '\n' + ' '.repeat(4 * m.groups.indent?.length) + '* ' + element + ': ' + m.groups.description
    }
  }
  if (i === 0) {
    s = '\nThe **' + call + '** command does not return anything.' + '\n\n\n\n'
  } else if (i === 1) {
    s = '\nThe **' + call + '** command returns the following element:' + s + '\n\n\n\n'
  } else if (i > 2) {
    s = '\nThe **' + call + '** command returns the following elements:' + s + '\n\n\n\n'
  }

  // Result sample
  s += '// tag::examples[]\n\n'

  i = 0
  matches = apidocPart.matchAll(/(?:----summary-start----\n```bash\n# (?<summary>.+?)\n```\n\n----summary-end----\n)?(?<code>```json\n[\s\S]+?```)/g)
  for (m of matches) {
    i++
    if (m.groups.summary) {
      const summary = m.groups.summary
      s += '// tag::example_' + i + '[] ' + '\n\n'
      s += '.Result sample: ' + m.groups.summary + '\n' + m.groups.code + '\n'
    } else {
      s += '// tag::example_' + i + '[]' + '\n\n'
      s += '.Result sample\n' + m.groups.code + '\n'
    }
    s += '// end::example_' + i + '[]\n\n'
  }

  s += '// end::examples[]\n\n'

  return s.trimEnd()
}

function split (s, start, end, altEnd) {
  if (altEnd) {
    return (s.split(start)[1] || '').split(end)[0].split(altEnd)[0].trim() + '\n'
  } else {
    return (s.split(start)[1] || '').split(end)[0].trim() + '\n'
  }
}

function pascalcase_to_snakecase (s) {
  return s.split(/\.?(?=[A-Z])/).join('_').toLowerCase()
}

function markdown_to_asciidoc (s, outputFileStem) {
  // Convert line breaks
  s = s.replace(/(<\/?br ?\/?>){2,}/g, '\n')
  s = s.replace(/<\/?br ?\/?>\n?/g, ' +\n')
  // Convert lists
  s = s.replace(/(?<=\n)(    )+?\*(?= )/g, (x) => '*'.repeat(1 + x.length / 4))
  // Add line break before lists
  s = s.replace(/(?<!\])((\n\*+ .+)+)/g, '\n$1')
  // Convert links
  function convertLinkForUG(match, p1, p2) {
    if (match.includes('](#')) {
      return 'xref:ROOT::' + outputFileStem + '.adoc' + p2 + '[' + p1 + ']'
    } else if (match.includes('](') && !match.includes('http') && !match.includes(':')) {
      return 'https://docs.outscale.com/' + p2 + '[' + p1 + ']'
    } else {
      return p2 + '[' + p1 + ']'
    }
  }
  s = s.replace(/\[(.+?)\]\((.+?)\)/g, convertLinkForUG)
  // Unescape pipe characters
  s = s.replace(/\\(\\)?\|/g, '|')
  // Correctly render monospace when it is a single space character
  s = s.replace(/<code><\/code>/g, '`` ``')
  // Correctly render monospace when it contains { or \ (to avoid special character interpretation)
  function replacer (match, p1) {
    if (!p1.includes('`') && (p1.includes('{') || p1.includes('\\'))) return '`+++' + p1 + '+++`'
    else return match
  }
  s = s.replaceAll(/`(.*?)`/g, replacer)
  // Convert admonitions
  s = s.replace(/(?<=\n)(\*\*)?(\[[A-Z]+?\])(\*\*)?( \+)?\n+?([\s\S]+)$/g, '$2\n====\n$5====\n')
  s = s.replace(/> (\*\*)?(\[[A-Z]+\])(\*\*)?( \+)?\n+?> (.+\n)/g, '$2\n====\n$5====\n')
  // Convert code blocks
  s = s.replaceAll(/```(.+?)--.+?\n([\s\S]+?)\n```/g, '[source,$1]\n----\n$2\n----')
  s = s.replaceAll(/```(.+?)\n([\s\S]+?)\n```/g, '[source,$1]\n----\n$2\n----')
  // if (isList) {
  //   // Adjust admonitions in parameter lists
  //   s = s.replace(/^(\[WARNING\]\n====)/g, '\n+\n$1')
  // }

  return s
}

module.exports = generateOctlPartials
