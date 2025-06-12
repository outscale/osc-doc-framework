function generatePythonExamples (data) {
  let basicAuth = false
  for (const security of data.security) {
    if ('BasicAuth' in security) {
      basicAuth = true
    }
  }

  const examples = data['x-customRequestExamples'] || {}
  let s = 'from osc_sdk_python import Gateway\n'
  if (basicAuth) {
    s += '# import os\n'
  }
  s += '\ngw = Gateway(**{"profile": "default"})'
  if (basicAuth) {
    s += '  # For access key/secret key authentication\n'
  } else {
    s += '\n'
  }

  if (basicAuth) {
    s +=
      '# gw = Gateway(email=os.environ.get("OSC_EMAIL"), password=os.environ.get("OSC_PASSWORD"))  # For login/password authentication\n'
  }
  s += '\n'

  for (let n = 0, length = examples.length; n < length; n++) {
    const objJson = examples[n].object
    if (examples[n].summary) {
      s += '# ' + examples[n].summary + '\n'
    }
    s += 'result = gw.' + data.operationUniqueName + '(\n'
    for (let [k, v] of Object.entries(objJson || {})) {
      // osc-sdk-python doesn't implement the DryRun parameter, so skip it
      if (k === 'DryRun' || k === 'dryRun') {
        continue
      }
      s += '    ' + k
      if (typeof v === 'object') {
        s += '=' + getPythonStyleObject(v, 1) + ',\n'
      } else if (isNaN(v)) {
        // EIM policies need to be formatted in a special way
        if (v.includes('"')) {
          s += "='" + v + "',\n"
        } else {
          s += '="' + v + '",\n'
        }
      } else {
        if (v === false) v = 'False'
        else if (v === true) v = 'True'
        // Workaround for strings composed entirely of digits
        else if (!Number.isInteger(v)) v = '"' + v + '"'
        s += '=' + v + ',\n'
      }
    }
    if (s.includes('"$OSC_PASSWORD"')) {
      s = s.replace('from osc_sdk_python import Gateway\n', 'from osc_sdk_python import Gateway\nimport os\n')
      s = s.replace('"$OSC_PASSWORD"', 'os.environ.get("OSC_PASSWORD")')
    }
    s += ')\n'
    s = s.replace('(\n)', '()')
    s += 'print(result)\n\n'
  }

  return s
}
function getPythonStyleObject (objectValue, level) {
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
    if (level < 5 && (!arrayType || typeof v1 === 'object')) {
      s += '\n' + spaceChar.repeat(marging * level)
    }
    if (!arrayType) {
      s += '"' + k1 + '": '
    }
    if (typeof v1 === 'object') {
      s += getPythonStyleObject(v1, level)
      addNewLine = true
    } else if (isNaN(v1)) {
      s += '"' + v1 + '"'
    } else {
      if (v1 === false) v1 = 'False'
      else if (v1 === true) v1 = 'True'
      else if (!Number.isInteger(v1)) v1 = '"' + v1 + '"'
      s += v1
    }
    if (level >= 5) {
      s += ', '
    } else {
      s += ','
    }
  }

  if (level >= 5) {
    s = s.slice(0, -2)
  }

  level -= 1
  if (arrayType) {
    if (level < 4 && addNewLine) {
      s += '\n' + spaceChar.repeat(marging * level)
    }
    s = s.replace(/,$/, '')
    s += ']'
  } else {
    if (level < 4) {
      s += '\n' + spaceChar.repeat(marging * level)
    }
    s = s.replace(/,$/, '')
    s += '}'
  }

  return s
}

module.exports = generatePythonExamples
