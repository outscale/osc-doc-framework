function generateOscCliExamples (data, lang) {
  data.operation['x-basicAuthFlag'] = false
  const examples = data['x-customRequestExamples'] || {}
  const options = createGeneralOptions(data)
  let s = printExamples(examples, options, data, lang)

  if (data.security?.find((n) => n.BasicAuth)) {
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

  options.push({ name: 'profile', value: '"default"' })

  if (data.operation['x-basicAuthFlag'] && !data.host.startsWith('icu')) {
    options.push(
      { name: 'authentication-method', value: '"password"' },
      { name: 'login', value: '"$OSC_EMAIL"' },
      { name: 'password', value: '"$OSC_PASSWORD"' }
    )
  }

  return options
}

function printExamples (examples, options, data, lang) {
  let s = ''

  for (let i = 0, length = examples.length; i < length; i++) {
    if (data.security?.length) {
      if (!data.operation['x-basicAuthFlag']) {
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

    s += 'osc-cli ' + data.host.split('.')[0] + ' ' + data.method.path.replace('/', '')
    for (const option of options) {
      s += printOption(option.name, option.value, true)
    }
    s += ' \\\n'

    s += printParams(examples[i].object, data)
    s = s.replace(/ \\\n$/, '')

    if (length && i < length - 1) {
      s += '\n'
      s += '```\n'
      s += '```' + lang + '\n'
    }
  }

  return s
}

function printParams (object, data) {
  let params = ''
  for (const [key, valueRaw] of Object.entries(object)) {
    let value = JSON.stringify(valueRaw, null, 2)
    value = overrideSomeValues(key, value, data)
    if (value) {
      // Indent string (except for first line)
      value = value.replace(/\n/g, '\n    ')
      // Keep level 2+ parameters on one line
      value = value.replace(/(?<=\{)\n( {9} +?".+?",?\n)+? +?(?=\})/g, (m) =>
        m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
      )
      value = value.replace(/(?<=\[)\n( {5} +?[^{].+?,?\n)+? +?(?=\])/g, (m) =>
        m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
      )
      value = value.replace(/(?<=[\[\{}])\n( {9} +?".+?": .+?,?\n)+? +?(?=[\]\}])/g, (m) =>
        m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
      )
      params += printOption(key, value)
    }
  }
  params = params.replace(/\.member\.N/g, '.member.0')
  params = params.replace(/\btrue\b/g, 'True')
  params = params.replace(/\bfalse\b/g, 'False')

  return params
}

function printOption (option, value, inline = false) {
  let quote = ''
  if (value.startsWith('{')) quote = "'"
  else if (value.startsWith('"{')) quote = "'"
  else if (value.startsWith('[')) quote = "'"
  else if (value.startsWith('$(')) quote = '"'
  else if (value.match(/"\d+?"/)) quote = "'"

  let separator = ' '
  if (value.match(/^\$\(cat .+?\.pem\)$/)) separator = '='

  if (inline) {
    return ' --' + option + separator + quote + value + quote
  }
  return '  --' + option + separator + quote + value + quote + ' \\\n'
}

function overrideSomeValues (k, v, data) {
  const call = data.method.path.replace('/', '')
  if (k === 'DryRun' || k === 'dryRun') {
    return 'False'
  } else if ((call === 'CreateVms' || call === 'UpdateVm') && k === 'UserData') {
    return '$(base64 -i user_data.txt)'
  }
  // Certificate parameter values need a special syntax
  else if (call === 'CreateKeypair' && k === 'PublicKey') {
    return '$(cat key_name.pub)'
  } else if (call === 'CreateCa' && k === 'CaPem') {
    return '$(cat ca-certificate.pem)'
  } else if (call === 'CreateServerCertificate' || call === 'UploadServerCertificate') {
    if (k === 'Body' || k === 'CertificateBody') {
      return '$(cat certificate.pem)'
    } else if (k === 'Chain' || k === 'CertificateChain') {
      return '$(cat certificate-chain.pem)'
    } else if (k === 'PrivateKey' || k === 'PrivateKey') {
      return '$(cat private-key.pem)'
    }
  } else if (data.host.startsWith('icu')) {
    if (data.security.length && !data.operation['x-basicAuthFlag']) {
      if (data.security.find((n) => n.BasicAuth)) {
        if (k === 'AuthenticationMethod') return undefined
        else if (k === 'Login') return undefined
        else if (k === 'Password') return undefined
      }
    } else {
      if (k === 'AuthenticationMethod') return '"password"'
      else if (k === 'Login') return '"$OSC_EMAIL"'
      else if (k === 'Password') return '"$OSC_PASSWORD"'
    }
  }

  return v
}

module.exports = generateOscCliExamples
