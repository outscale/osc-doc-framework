function generateCurlExamples (data, lang) {
  data.operation['x-basicAuthFlag'] = false
  const examples = data['x-customRequestExamples'] || {}
  const options = createGeneralOptions(data)
  let s = printExamples(examples, options, data, lang)

  if (data.security?.find((n) => n.BasicAuth) && data.custom.isAGatewayApi(data.host)) {
    data.operation['x-basicAuthFlag'] = true
    s += '\n\n'
    s += '```\n'
    s += '```' + lang + '\n'
    const options = createGeneralOptions(data)
    s += printExamples([examples[examples.length - 1]], options, data, lang)
  }

  return s
}

function createGeneralOptions (data) {
  const options = []

  if (!data.custom.isAGatewayApi(data.host)) {
    if (data.security?.length && data.security.find((n) => n.AccessKeyAuth)) {
      options.push({ name: 'header', value: 'AccessKey: $OSC_ACCESS_KEY' })
      options.push({ name: 'header', value: 'SecretKey: $OSC_SECRET_KEY' })
    }
    if (data.consumes?.length) {
      options.push({ name: 'header', value: 'Content-Type: ' + data.consumes[0] })
    }
  } else if (data.host.startsWith('api') || data.host.startsWith('okms')) {
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

function printExamples (examples, options, data, lang) {
  let s = ''
  for (let i = 0, length = examples.length; i < length; i++) {
    if (data.security?.length) {
      if (!data.operation['x-basicAuthFlag']) {
        if (i === 0 && data.custom.isAGatewayApi(data.host)) {
          s += '# You need Curl version 7.75 or later to use the --aws-sigv4 option\n\n'
        }
        if (examples[i].summary) {
          s += '# ' + examples[i].summary + '\n\n'
        } else if (i === 0 && data.security.find((n) => n.BasicAuth)) {
          s += '# Example with access key/secret key authentication\n'
          if (data.api.info?.title === 'OKS API' || data.host?.includes('oks.outscale.')) {
            s += '# (See the "Authentication Schemes" section for other authentications)\n'
          }
          s += '\n'
        }
      } else {
        s += '# Example with login/password authentication\n\n'
      }
    } else if (examples[i].summary) {
      s += '# ' + examples[i].summary + '\n\n'
    }

    let verb = ' -X ' + data.methodUpper

    let url = data.url
    if (data.custom.isAGatewayApi(data.host) && !data.host.startsWith('api') && !data.host.startsWith('okms')) {
      url = data.baseUrl
    }
    url = url.replace('{region}', "'$OSC_REGION'").replace('eu-west-2', "'$OSC_REGION'")
    url = url.replace('{', '----highlight-string-start----{').replace('}', '}----highlight-end----')

    let query = ''
    if (data.queryString) {
      query = '----highlight-string-start----' + data.queryString.replace(/\b\?/g, '&') + '----highlight-end----'
    }

    s += 'curl' + verb + " '" + url + query + "' \\\n"

    for (const header of data.headerParameters) {
      options.push({ name: 'header', value: header.name + ': ' + header.exampleValues.object })
    }
    for (const option of options) {
      s += printOption(option.name, option.value)
    }

    if (data.consumes?.length) {
      if (
        data.host.startsWith('fcu') ||
        data.host.startsWith('lbu') ||
        data.host.startsWith('eim')
      ) {
        let params = printParamsAsUrlEncodes(examples[i].object, null, data)
        params = params.replace(/\.member\.N/g, '.member.0')
        s += params
      } else if (data.consumes[0].endsWith('json')) {
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
        s += printOption('data', '...')
      }
    }
    s = s.replace(/ \\\n$/, '')

    if (length && i < length - 1) {
      s += '\n'
      s += '```\n'
      s += '```' + lang + '\n'
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
  else if (value.includes('$')) {
    quote = ''
    value = "'" + value.replace(/(\$[A-Z_]+?\b)/g, "'$1'") + "'"
    value = value.replace(/''$/g, '')
  }

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
