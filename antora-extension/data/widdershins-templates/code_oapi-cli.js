function generateOapiCliExamples(data) {
  data.operation['x-basicAuthFlag'] = false
  const examples = data['x-customRequestExamples'] || {}
  const options = createGeneralOptions(data)
  let s = printExamples(examples, options, data)

  if (data.security?.find((n) => n.BasicAuth)) {
    data.operation['x-basicAuthFlag'] = true
    s += '\n\n'
    s += '```\n'
    s += '```console--oapi-cli\n'
    const options = createGeneralOptions(data)
    s += printExamples([examples[examples.length - 1]], options, data)
  }

  return s
}

function createGeneralOptions (data) {
  const options = []

  options.push({ name: 'profile', value: '"default"' })

  if (data.operation['x-basicAuthFlag']) {
    options.push(
      { name: 'login', value: '"$OSC_EMAIL"' },
      { name: 'password', value: '"$OSC_PASSWORD"' },
    )
  }

  return options
}

function printExamples (examples, options, data) {
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

    s += 'oapi-cli'
    for (const option of options) {
      s += printOption(option.name, option.value, true)
    }
    s += ' ' + data.method.path.replace('/', '')
    s += ' \\\n'

    s += printParams(examples[i].object, data)
    s = s.replace(/ \\\n$/, '')

    if (length && i < length - 1) {
      s += '\n'
      s += '```\n'
      s += '```console--oapi-cli\n'
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
  else if (value.match(/"\d+?"/)) quote = ""

  let separator = ' '
  if (value.match(/^\$\(cat .+?\.pem\)$/)) separator = '='

  if (inline) {
    return ' --' + option + separator + quote + value + quote
  }
  return '  --' + option + separator + quote + value + quote + ' \\\n'
}

function overrideSomeValues (k, v, data) {
  const call = data.method.path.replace('/', '')
  if (k === 'DryRun') {
    return 'False'
  } else if (k === 'Document' || k === 'PolicyDocument') {
    return '--jsonstr-file "policy.json"'
  } else if ((call === 'CreateVms' || call === 'UpdateVm') && k === 'UserData') {
    return '$(base64 -i user_data.txt)'
  }

  // Certificate parameter values need a special syntax
  else if (call === 'CreateKeypair' && k === 'PublicKey') {
    return '--file "key_name.pub"'
  } else if (call === 'CreateCa' && k === 'CaPem') {
    return '--file "ca-certificate.pem"'
  } else if ((call === 'CreateServerCertificate') || (call === 'UploadServerCertificate')) {
    if ((k === 'Body') || (k === 'CertificateBody') ) {
      return '--file "certificate.pem"'; 
    } else if ( (k === 'Chain') || (k === 'CertificateChain') ) {
      return '--file "certificate-chain.pem"'
    } else if ( (k === 'PrivateKey') || (k === 'PrivateKey') ) {
      return '--file "private-key.pem"'
    }
  }

  return v
}

module.exports = generateOapiCliExamples
