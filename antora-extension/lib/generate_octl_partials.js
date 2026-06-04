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
        markdown_to_asciidoc(mainDescription),
        markdown_to_asciidoc(requestSample),
        markdown_to_asciidoc(options),
        markdown_to_asciidoc(resultElementsAndResultSample),
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

  let description = split(apidocText, start, end)

  const match = description.match(/^> \[WARNING\]<br \/>\n(> .*?\n\n?)+?(?=[^>])/)
  if (match) {
    const warning = match[0]
    const desc_no_warning = description.slice(warning.length)
    description = warning
    description += 'The **' + call + '** command ' + desc_no_warning[0].toLowerCase() + desc_no_warning.slice(1)
  } else {
    description = 'The **' + call + '** command ' + description[0].toLowerCase() + description.slice(1)
  }

  return description
}

function getRequestSample (apidocText, service, call) {
  let s = ''
  const matches = apidocText.matchAll(/```shell--octl\n[\s\S]+?(?=```)/g)
  for (m of matches) {
    m[0] = m[0].replaceAll(/# For more information, see .+?octl.+?\n\n/g, '')
    m[0] = m[0].replaceAll(/(?<=^|\n)octl/g, '$ octl')
    m[0] = m[0].replaceAll('&lt', '<').replaceAll('&gt', '>')
    const summary = m[0].match(/#+? .+?\n/g)
    if (summary) {
      s += '\n.Request sample: ' + summary[0].replace(/^# +?/, '') + m[0].replace(summary[0] + '\n', '').trimEnd() + '\n```\n'
    } else {
      s += '\n.Request sample\n' + m[0].trimEnd() + '\n```\n'
    }
  }

  return s.trim()
}

function getOptions (octlText, apidocText, service) {
  let s = ''

  const octlStart = '\n### Options\n'
  const octlEnd = '\n### Options inherited'
  let octlPart = split(octlText, octlStart, octlEnd)

  const apidocStart = '>Request Parameters</h3>\n'
  const apidocEnd = '>Response Elements</h3>\n'
  const apidocPart = split(apidocText, apidocStart, apidocEnd)

  const matches = octlPart.matchAll(/\n      --(?<option>.+?)(?<type>(?: \S+?)?)\b   +(?<description>.*)/g)
  for (const m of matches) {
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
    if (!apidocPartMatch[1]) {
      required = '(optional) '
    }
    const description = required + apidocPartMatch[2]
    s += '\n* `' + m.groups.option + '`: ' + description
  }

  if (s) {
    s = '\nThis command contains the following options that you need to specify:' + s
  }

  return s
}

function getResultElementsAndResultSample (apidocText, call) {
  let s = '\nThe **' + call + '** command returns the following elements:'

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

  // Result sample
  matches = apidocPart.matchAll(/(?:----summary-start----\n```bash\n# (?<summary>.+?)\n```\n\n----summary-end----\n)?(?<code>```json\n[\s\S]+?```)/g)
  for (m of matches) {
    if (m.groups.summary) {
      s += '\n\n.Result sample: ' + m.groups.summary + '\n' + m.groups.code
    } else {
      s += '\n\n.Result sample\n' + m.groups.code
    }
  }

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

function markdown_to_asciidoc (s) {
  // Convert line breaks
  s = s.replace(/(<\/?br ?\/?>){2,}/g, '\n')
  s = s.replace(/<\/?br ?\/?>\n?/g, ' +\n')
  // Convert lists
  s = s.replace(/(?<=\n)(    )+?\*(?= )/g, (x) => '*'.repeat(1 + x.length / 4))
  // Add line break before lists
  s = s.replace(/((\n\*+ .+)+)/g, '\n$1')
  // Convert links
  function convertLinkForUG(match, p1, p2) {
    if (match.includes('](#')) {
      return 'xref:ROOT::api.adoc' + p2 + '[' + p1 + ']'
    } else {
      return p2 + '[' + p1 + ']'
    }
  }
  s = s.replace(/\[(.+?)\]\((.+?)\)/g, convertLinkForUG)
  // Unescape pipe characters
  s = s.replace(/\\\|/g, '|')
  // Correctly render monospace when it is a single space character
  s = s.replace(/<code><\/code>/g, '`` ``')
  // Convert admonitions
  s = s.replace(/(?<=\n)(\*\*)?(\[[A-Z]+?\])(\*\*)?( \+)?\n+?([\s\S]+)$/g, '$2\n====$5====\n')
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
