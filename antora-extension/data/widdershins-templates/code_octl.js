function generateOctlExamples (data, lang) {
  const examples = data['x-customRequestExamples'] || {}
  let s = printExamples(examples, data, lang)

  return s
}

function printExamples (examples, data, lang) {
  let s = ''
  for (let i = 0, length = examples.length; i < length; i++) {
    const pathParams = convertQueryAndHeaderParameters(data.parameters, 'path')
    const queryParams = convertQueryAndHeaderParameters(data.parameters, 'query')
    const headerParams = convertQueryAndHeaderParameters(data.parameters, 'header')
    const bodyParams = examples[i].object

    if (examples[i].summary) {
      s += '# ' + examples[i].summary + '\n\n'
    }

    let api_name = 'iaas'
    if (data.api.info?.title === 'OKS API' || data.host?.includes('oks.outscale.')) {
      api_name = 'kube'
    }
    s += 'octl ' + api_name + ' api ' + data.operation.operationId

    for (const [k, v] of Object.entries(pathParams)) {
      if (v === 'string' || v === 0 || v === true || v === false) {
        s += ' &lt' + k + '&gt'
      } else {
        s += ' &lt' + v + '&gt'
      }
    }
    s += ' --profile "default" \\\n'
    s += printParams(queryParams, null, data)
    s += printParams(headerParams, null, data)
    s += printParams(bodyParams, null, data)
    s = s.replace(/ \\\n$/, '')

    if (length && i < length - 1) {
      s += '\n'
      s += '```\n'
      s += '```' + lang + '\n'
    }
  }

  return s
}

function convertQueryAndHeaderParameters (params, paramsLocation) {
  const object = {}
  const filteredParams = params.filter((n) => n.in === paramsLocation)
  for (const n of filteredParams) {
    object[n.name] = n.exampleValues.object
  }

  return object
}

function printParams (object, previousPath, data) {
  let params = ''
  for (let [key, value] of Object.entries(object)) {
    let currentPath
    if (previousPath) {
      currentPath = snakecase_to_pascalcase(previousPath) + '.' + snakecase_to_pascalcase(key)
    } else {
      currentPath = snakecase_to_pascalcase(key)
    }
    if (Array.isArray(object[key]) || typeof object[key] === 'object') {
      params += printParams(object[key], currentPath, data)
    } else {
      // Remove index if it's at the very end of a parameter name
      currentPath = currentPath.replace(/\.\d+?$/g, '')
      value = overrideSomeValues(key, value, data)
      params += printOption(currentPath, value)
      // Merge parameters if it's a list of values of the same parameter
      params = params.replace(/( .+?--.+) (.+?) \\\n\1 (.+?) \\\n$/, '$1 $2,$3 \\\n')
    }
  }

  return params
}

function printOption (option, value) {
  let quote = '"'
  if (typeof value === 'string' || value instanceof String) {
    if (value.startsWith('{')) quote = "'"
    else if (value.startsWith('"{')) quote = "'"
    else if (value.startsWith('[')) quote = "'"
    else if (value.startsWith('$(')) quote = '"'
  } else {
    quote = ''
  }

  let separator = ' '
  if (value === true || value === false) {
    separator = '='
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
  }

  return v
}

function snakecase_to_pascalcase (s) {
  let s_new = ''
  let array = s.split(/_|-/)
  for (n of array) {
    s_new += n.charAt(0).toUpperCase() + n.slice(1)
  }

  return s_new
}

module.exports = generateOctlExamples
