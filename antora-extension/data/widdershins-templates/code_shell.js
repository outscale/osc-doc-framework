function generateCurlExamples (data) {
  data.operation['x-basicAuthFlag'] = false
  const examples = data['x-customRequestExamples'] || {}
  const options = createGeneralOptions(data)
  let s = printExamples(examples, options, data)

  if (data.security?.find((n) => n.BasicAuth)) {
    data.operation['x-basicAuthFlag'] = true
    s += '\n\n'
    s += '```\n'
    s += '```shell\n'
    const options = createGeneralOptions(data)
    s += printExamples([examples[examples.length - 1]], options, data)
  }

  return s
}

function createGeneralOptions (data) {
  const options = []

  if (data.host.startsWith('api')) {
    if (data.security?.length && !data.operation['x-basicAuthFlag']) {
      options.push({ name: 'user', value: '$OSC_ACCESS_KEY:$OSC_SECRET_KEY' }, { name: 'aws-sigv4', value: 'osc' })
    } else if (data.operation['x-basicAuthFlag']) {
      options.push(
        { name: 'header', value: 'Authorization: Basic $(echo -n "$OSC_EMAIL:$OSC_PASSWORD" | base64)' },
        { name: 'header', value: 'X-Osc-Date: $(TZ=GMT date +%Y%m%dT%H%M%SZ)' }
      )
    }
    options.push({ name: 'header', value: 'Content-Type: application/json' })
  } else {
    if (data.security?.length && !data.operation['x-basicAuthFlag']) {
      options.push({ name: 'user', value: '$OSC_ACCESS_KEY:$OSC_SECRET_KEY' }, { name: 'aws-sigv4', value: 'aws:amz' })
    }
    if (data.host.startsWith('icu') || data.host.startsWith('directlink') || data.host.startsWith('kms')) {
      let service = ''
      if (data.host.startsWith('icu')) service = 'TinaIcuService'
      else if (data.host.startsWith('directlink')) service = 'OvertureService'
      else if (data.host.startsWith('kms')) service = 'TrentService'
      options.push(
        { name: 'header', value: 'x-amz-target: ' + service + '.' + data.method.path.replace('/', '') },
        { name: 'header', value: 'Content-Type: application/x-amz-json-1.1' }
      )
    } else {
      options.push(
        { name: 'data-urlencode', value: 'Version=' + data.version },
        { name: 'data-urlencode', value: 'Action=' + data.method.path.replace('/', '') }
      )
    }
  }

  return options
}

function printExamples (examples, options, data) {
  let s = ''
  for (let i = 0, length = examples.length; i < length; i++) {
    if (data.security?.length) {
      if (!data.operation['x-basicAuthFlag']) {
        if (i === 0) {
          s += '# You need Curl version 7.75 or later to use the --aws-sigv4 option\n\n'
        }
        if (examples[i].summary) {
          s += '# ' + examples[i].summary + '\n\n'
        } else if (i === 0 && data.security.find((n) => n.BasicAuth)) {
          s += '# Example with access key/secret key authentication\n\n'
        }
      } else {
        s += '# Example with login/password authentication\n\n'
      }
    } else if (examples[i].summary) {
      s += '# ' + examples[i].summary + '\n\n'
    }

    let url = data.baseUrl.replace('{region}', '$OSC_REGION')
    if (data.host.startsWith('api')) {
      url += data.method.path
    }

    let verb = ' -X ' + data.methodUpper
    if (data.methodUpper === 'GET') {
      verb = ''
    }

    s += 'curl' + verb + ' ' + url + data.requiredQueryString + ' \\\n'

    for (const option of options) {
      s += printOption(option.name, option.value)
    }

    if (
      data.host.startsWith('api') ||
      data.host.startsWith('icu') ||
      data.host.startsWith('directlink') ||
      data.host.startsWith('kms')
    ) {
      let obj = JSON.stringify(examples[i].object, (k, v, data) => overrideSomeValues(k, v, data), 2)
      // Escape shell variables
      obj = obj.replace(/"(\$.+?)"/g, '"\'$1\'"')
      // Indent string (except for first line)
      obj = obj.replace(/\n/g, '\n  ')
      // Keep level 2+ parameters on one line
      obj = obj.replace(/(?<=\{)\n( {9} +?".+?",?\n)+? +?(?=\})/g, (m) =>
        m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
      )
      obj = obj.replace(/(?<=\[)\n( {5} +?[^{].+?,?\n)+? +?(?=\])/g, (m) =>
        m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
      )
      obj = obj.replace(/(?<=[\[\{}])\n( {9} +?".+?": .+?,?\n)+? +?(?=[\]\}])/g, (m) =>
        m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
      )
      s += printOption('data', obj)
    } else {
      let params = printParamsAsUrlEncodes(examples[i].object, null, data)
      params = params.replace(/\.member\.N/g, '.member.0')
      s += params
    }
    s = s.replace(/ \\\n$/, '')

    if (length && i < length - 1) {
      s += '\n'
      s += '```\n'
      s += '```shell\n'
    }
  }

  return s
}

function printOption (option, value) {
  let quote = "'"
  if (value.startsWith('{')) quote = "'"
  else if (value.includes("'")) quote = '"'
  else if (value.includes('$(')) quote = '"'
  else if (value.startsWith('$')) quote = ''

  return '  --' + option + ' ' + quote + value + quote + ' \\\n'
}

function printParamsAsUrlEncodes (object, previousPath, data) {
  let params = ''
  for (let [key, value] of Object.entries(object)) {
    const currentPath = previousPath ? `${previousPath}.${key}` : key
    if (Array.isArray(object[key]) || typeof object[key] === 'object') {
      params += printParamsAsUrlEncodes(object[key], currentPath, data)
    } else {
      value = overrideSomeValues(key, value, data)
      params += printOption('data-urlencode', currentPath + '=' + value)
    }
  }

  return params
}

function overrideSomeValues (k, v, data) {
  if (k === 'DryRun' || k === 'dryRun') {
    return false
  } else if (data?.host.startsWith('icu')) {
    if (data.security.length && !data.operation['x-basicAuthFlag']) {
      if (data.security.find((n) => n.BasicAuth)) {
        if (k === 'AuthenticationMethod') return 'accesskey'
        else if (k === 'Login') return undefined
        else if (k === 'Password') return undefined
      }
    } else {
      if (k === 'AuthenticationMethod') return 'password'
      else if (k === 'Login') return '$OSC_EMAIL'
      else if (k === 'Password') return '$OSC_PASSWORD'
    }
  }

  return v
}

module.exports = generateCurlExamples
