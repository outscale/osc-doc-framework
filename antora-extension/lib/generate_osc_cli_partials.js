const fs = require('fs')

function generateOscCliPartials (apiMarkdown, api, outputFolder) {
  const codeSamples = createCodeSamples(apiMarkdown)
  createOscCliSections(api, codeSamples, outputFolder)
}

function createCodeSamples (apiMarkdown) {
  const matches = [
    ...apiMarkdown.matchAll(/<a name="(?<name>.+?-example\.sh)"><\/a>\n(?<examples>(\n```console\n[\s\S]+?\n```)+)/g),
  ]
  const codeSamples = {}
  for (let i = 0, length = matches.length; i < length; i++) {
    const k = matches[i].groups.name
    let v = matches[i].groups.examples
    if (k.endsWith('.sh')) {
      v = v.replaceAll('osc-cli', '$ osc-cli')
      v = v.replaceAll('\n  ', '\n    ')
    }
    codeSamples[k] = v
  }

  return codeSamples
}

function createOscCliSections (api, codeSamples, outputFolder) {
  const paths = api.paths
  const schemas = api.components.schemas
  const apiName = api.servers[0].url.split('https://')[1].split('.')[0]

  for (const path of Object.values(paths)) {
    const post = path.post
    const operation = post.operationId
    let s = '// tag::main-description[]\n\n'
    s += formatMainDescription(path.description, operation)
    s += '\n'
    s += '// end::main-description[]\n\n\n\n'

    s += formatRequestSamples(codeSamples[operation + '-req-example.sh'])

    s += 'This command contains the following attributes that you need to specify:\n\n'
    const reqRef = post.requestBody.content['application/json'].schema['x-widdershins-oldRef'].split('/').pop()
    s += '// tag::request-parameters[]\n\n'
    s += getRef(schemas[reqRef], 1, true) + '\n'
    s += '// end::request-parameters[]\n\n\n\n'

    s += 'The **' + operation + '** command returns the following elements:\n\n'
    const respRef = post.responses['200'].content['application/json'].schema['x-widdershins-oldRef'].split('/').pop()
    s += getRef(schemas[respRef], 1, false) + '\n\n\n'

    // s += (
    //     ".Result sample\n[source,json]\n----\n"
    //     + codeSamples[operation + "-res-example.json"] + "\n"
    //     + "----\n\n"
    // )
    s += getResultSamplesFromYaml(path)

    fs.mkdirSync(outputFolder, { recursive: true })
    fs.writeFileSync(process.cwd() + '/' + outputFolder + '/_RC-OscCli-' + apiName + '-' + operation + '.adoc', s)
  }
}

function formatMainDescription (description, operation) {
  if (description !== 'NOT_FOUND') {
    description = formatDescription(description)
    const match = description.match(/^\[WARNING\]\n====\n(.*?\n)+?====\n/)
    if (match) {
      const warning = match[0]
      const desc_no_warning = description.slice(warning.length)
      description = warning
      description += 'The **' + operation + '** command ' + desc_no_warning[0].toLowerCase() + desc_no_warning.slice(1)
    } else {
      description = 'The **' + operation + '** command ' + description[0].toLowerCase() + description.slice(1)
    }
  }

  return description
}

function formatDescription (description) {
  if (description) {
    // Convert line breaks
    description = description.replace(/(<\/?br ?\/?>){2,}/g, '\n')
    description = description.replace(/<\/?br ?\/?>\n?/g, ' +\n')
    // Add line break before lists
    description = description.replace(/((\n\*+ .+)+)/g, '\n$1')
    // Convert links
    description = description.replace(/\[(.+?)\]\((.+?)\)/g, convertLink)
    // Unescape pipe characters
    description = description.replace(/\\\|/g, '|')
    // Correctly render monospace when it is a single space character
    description = description.replace(/\B` `\B/g, '`` ``')
    // Convert admonitions
    description = description.replace(/(?<=\n)(\*\*)?(\[[A-Z]+?\])(\*\*)?( \+)?\n+?([\s\S]+)$/g, '$2\n====\n$5\n====')
    description = description.replace(/> (\*\*)?(\[[A-Z]+\])(\*\*)?( \+)?\n+?> (.+\n)/g, '$2\n====\n$5\n====')
  }

  return description
}

function convertLink(match, p1, p2) {
  if (match.includes('](#')) {
    return 'https://docs.outscale.com/api' + p2 + '[' + p1 + ']'
  } else {
    return p2 + '[' + p1 + ']'
  }
}

function getRef (schema, level, requestFlag) {
  let s = ''
  const properties = schema.properties || schema.items?.properties || {}
  for (const [k, v] of Object.entries(properties)) {
    if (requestFlag) {
      s += '// tag::' + k + '[]\n'
    }
    s += '*'.repeat(level) + ' `' + k + '`:'
    if (requestFlag) {
      if ((schema.required?.includes(k) === false) || schema.required === undefined) {
        s += ' (optional)'
      }
    }
    s += ' ' + formatDescription(v.description) + '\n'
    s += getRef(v, level + 1, requestFlag)
    if (requestFlag) {
      s += '// end::' + k + '[]\n'
    }
  }

  return s
}

function formatRequestSamples (s) {
  const commands = s.matchAll(/(# (?<summary>.+)\n\n)?(?<command>\$ osc-cli [\s\S]+?)(?=\n```)/g)
  let s2 = '// tag::examples[]\n\n'
  let i = 0
  for (const command of commands) {
    i++
    const tagName = 'example_' + i
    const summary = command.groups.summary || ''
    if (summary) {
      s2 += '// tag::' + tagName + '[] ' + summary + '\n\n'
      s2 += '.Request sample: ' + summary + '\n'
    } else {
      s2 += '// tag::' + tagName + '[]' + '\n\n'
      s2 += '.Request sample' + '\n'
    }
    s2 +=
      '[source,shell]\n' + '----\n' + command.groups.command.trim() + '\n' + '----\n' + '// end::' + tagName + '[]\n\n'
  }
  s2 += '// end::examples[]\n\n\n\n'

  return s2
}

function getResultSamplesFromYaml (path) {
  let s = '// tag::examples[]\n\n'
  const examples = path.post.responses['200'].content['application/json'].examples || {}
  for (const [k, v] of Object.entries(examples)) {
    const tagName = k.replace('ex', 'example_')
    const summary = v.summary || ''
    if (summary) {
      s += '// tag::' + tagName + '[] ' + summary + '\n\n'
      s += '.Result sample: ' + summary + '\n'
    } else {
      s += '// tag::' + tagName + '[]' + '\n\n'
      s += '.Result sample' + '\n'
    }
    s += '[source,json]\n'
    s += '----\n'
    s += JSON.stringify(v.value, null, 2) + '\n'
    s += '----\n'
    s += '// end::' + tagName + '[]\n\n'
  }
  s += '// end::examples[]\n\n'

  return s
}

module.exports = generateOscCliPartials
