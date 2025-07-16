function generateHttpExamples (data, lang) {
    let s = ''
  
    let pathname, host
    if (data.baseUrl !== '/') {
      const url = new URL(data.baseUrl)
      pathname = url.pathname + data.method.path
      host = url.host
    } else {
      pathname = data.method.path
      host = data.baseUrl
    }
  
    const isItOksApi = data.api.info?.title === 'OKS API' || data.host?.includes('oks.outscale.')
    if (isItOksApi) {
      s += '----highlight-comment-start----# Example with access key/secret key authentication----highlight-end----\n'
      s += '----highlight-comment-start----# (See the "Authentication Schemes" section for other authentications)----highlight-end----\n\n'
    }
  
    const examples = data['x-customRequestExamples'] || {}
    for (let i = 0, length = examples.length; i < length; i++) {
      if (examples[i].summary) {
        s += '----highlight-comment-start----# ' + examples[i].summary + '----highlight-end----\n'
      }
      if (data.operation['x-webhook']) {
        s += printRequestLine(data, '/')
        s += printHeaders(data, null, isItOksApi)
      } else {
        s += printRequestLine(data, pathname)
        s += printHeaders(data, host, isItOksApi)
      }
      s += printBody(data, examples[i])
      if (length && i < length - 1) {
        s += '\n\n'
        s += '```\n'
        s += '```' + lang + '\n'
      }
    }
    if (!examples.length) {
      s += printRequestLine(data, pathname)
      s += printHeaders(data, host, isItOksApi)
    }
  
    return s
  }
  
  function printRequestLine (data, pathname) {
    let s = data.methodUpper + ' ' + pathname + data.queryString.replace(/\b\?/g, '&') + ' HTTP/1.1\n'
  
    return s
  }
  
  function printHeaders (data, host, isItOksApi) {
    let s = ''
    if (host) {
      s += 'Host: ' + host + '\n'
    }
    for (const p of data.headerParameters) {
      s += p.name + ': ' + p.exampleValues.object + '\n'
    }
    if (data.consumes.length) {
      s += 'Content-Type: ' + data.consumes[0] + '\n'
    }
  
    // if (1 === 1) {
    //   const provider = 'osc'
    //   let contentType = ''
    //   if (data.consumes.length) contentType = 'content-type'
    //   s += 'Authorization: ' + provider.toUpperCase + '4-HMAC-SHA256 Credential=XXXX/20101001/eu-west-2/api/' + provider + '4_request, '
    //   s += 'SignedHeaders=' + contentType + 'host;x-' + provider '-date, '
    //   s += 'Signature=ZZZZ\n'
    //   s += 'X-Osc-Date: 20170510T123456Z\n'
    // } else if (2 === 2) {
    //   s += 'Authorization: Basic YYYY\n'
    //   s += 'X-Osc-Date: XXXX\n'
    // }
    if (isItOksApi) {
      s += 'AccessKey: XXXX\n'
      s += 'SecretKey: YYYY\n'
    }
  
    return s
  }
  
  function printBody (data, example) {
    let s = '\n'
    if (data.consumes.length) {
      if (data.consumes[0].includes('json')) {
        s += JSON.stringify(example.object, null, 2)
        // Keep level 2+ parameters on one line
        s = s.replace(/(?<=\{)\n( {7} +?".+?",?\n)+? +?(?=\})/g, (m) =>
          m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
        )
        s = s.replace(/(?<=\[)\n( {3} +?[^{].+?,?\n)+? +?(?=\])/g, (m) =>
          m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
        )
        s = s.replace(/(?<=[\[\{}])\n( {7} +?".+?": .+?,?\n)+? +?(?=[\]\}])/g, (m) =>
          m.replace(/\n/g, '').replace(/, +/g, ', ').replace(/  +/g, '')
        )
      } else if (data.consumes[0] === 'application/x-www-form-urlencoded') {
        s += data.custom.urlEncode(example.object)
      } else {
        s += '...'
      }
    }
  
    return s
  }
  
  module.exports = generateHttpExamples
  