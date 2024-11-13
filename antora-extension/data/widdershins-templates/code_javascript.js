function generateJavaScriptExamples (data) {
  let s = ''
  let exampleContent = ''
  const examples = data['x-customRequestExamples'] || {}

  s += 'const osc = require("outscale-api");\n'
  s += 'const crypto = require("crypto");\n'
  s += 'global.crypto = crypto.webcrypto;\n\n'
  s += 'async function main() {\n'
  s += '    const config = new osc.Configuration({\n'
  let endpoint = data.baseUrl
  if (endpoint.includes('{region}') === true) {
    endpoint = endpoint.split('{region}')[0] + '" + process.env.OSC_REGION + "' + endpoint.split('{region}')[1]
  }
  s += '        basePath: "' + endpoint + '",\n'
  for (const security of data.security) {
    if ('ApiKeyAuth' in security || 'ApiKeyAuthSec' in security) {
      s += '        awsV4SignParameters: {\n'
      s += '            accessKeyId: process.env.OSC_ACCESS_KEY,\n'
      s += '            secretAccessKey: process.env.OSC_SECRET_KEY,\n'
      s += '            service: "api",\n'
      s += '        },\n'
    } else if ('BasicAuth' in security) {
      s += '        /* For login/password authentication, replace the above awsV4SignParameters key with: */\n'
      s += '        /* username: process.env.OSC_USERNAME, */\n'
      s += '        /* password: process.env.OSC_PASSWORD, */\n'
    }
  }
  s += '    });\n'
  s += '    const api = new osc.' + data.operation.tags[0] + 'Api(config);\n\n'

  let increment = 1
  for (let n = 0, length = examples.length; n < length; n++) {
    if (examples[n].summary) {
      s += '    /* ' + examples[n].summary + ' */\n'
    }
    exampleContent = getExampleContent(examples[n].object, data, increment)
    s += exampleContent
    increment += 1
  }
  s = s.replace('"$OSC_PASSWORD"', 'process.env.OSC_PASSWORD')
  s += '}\n\n'
  s += 'main();\n\n'

  return s
}

function getExampleContent (objJson, data, increment) {
  let s = ''
  const operationUniqueName = lowercaseFirstLetter(data.operationUniqueName)

  let result = 'result'
  if (increment > 1) {
    result += increment
  }
  s += '    const ' + result + ' = await api.' + operationUniqueName + '({\n'
  s += '        ' + operationUniqueName + 'Request: {\n'
  for (let [k, v] of Object.entries(objJson)) {
    k = lowercaseFirstLetter(k)
    s += '            ' + k + ':'
    if (typeof v === 'object') {
      s += ' ' + getJsonStyleObject(v, 3) + ',\n'
    } else if (isNaN(v)) {
      // EIM policies need to be formatted in a special way
      if (v.includes('"')) {
        s += " '" + v + "',\n"
      } else {
        s += ' "' + v + '",\n'
      }
    } else {
      // Workaround for DryRun parameter
      if (k === 'dryRun') {
        v = 'false'
      }
      // Workaround for strings composed entirely of digits
      else if (v !== true && v !== false && !Number.isInteger(v)) {
        v = '"' + v + '"'
      }
      s += ' ' + v + ',\n'
    }
  }
  s = s.replace(/, \n/g, ',\n')
  s = s.replace(/,(,|\])/g, '$1')
  s += '        },\n'
  s += '    });\n'
  s = s.replace(/{\n {8}},\n/, '{},\n')
  s += '    console.log(' + result + ');\n\n'

  return s
}

function getJsonStyleObject (objectValue, level) {
  let s = ''
  let first = true
  let arrayType = false
  const marging = 4
  const spaceChar = ' '
  let addNewLine = false

  level += 1

  for (let [k1, v1] of Object.entries(objectValue)) {
    if (first) {
      first = false
      if (k1 === '0') {
        s = '['
        arrayType = true
      } else {
        s = '{'
      }
    }
    if (level < 10 && (!arrayType || typeof v1 === 'object')) {
      s += '\n' + spaceChar.repeat(marging * level)
    }
    if (!arrayType) {
      s += lowercaseFirstLetter(k1) + ': '
    }
    if (typeof v1 === 'object') {
      s += getJsonStyleObject(v1, level)
      addNewLine = true
    } else if (isNaN(v1)) {
      s += '"' + v1 + '"'
    } else {
      if (v1 !== true && v1 !== false && !Number.isInteger(v1)) {
        v1 = '"' + v1 + '"'
      }
      s += v1
    }
    s += ', '
  }

  if (level >= 10) {
    s = s.slice(0, -2)
  } else {
    s = s.slice(0, -1)
  }

  level -= 1
  if (arrayType) {
    if (level < 9 && addNewLine) {
      s += '\n' + spaceChar.repeat(marging * level)
    }
    s += ']'
  } else {
    if (level < 9) {
      s += '\n' + spaceChar.repeat(marging * level)
    }
    s += '}'
  }

  return s
}

function lowercaseFirstLetter (s) {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

module.exports = generateJavaScriptExamples
