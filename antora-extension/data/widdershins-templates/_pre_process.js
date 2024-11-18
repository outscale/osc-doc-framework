const generateCurlExamples = require('./code_shell')
const generateHclExamples = require('./code_hcl')
const generateJavaScriptExamples = require('./code_javascript')
const generateOapiCliExamples = require('./code_oapi-cli')
const generateOscCliExamples = require('./code_console')
const generatePythonExamples = require('./code_python')

const DEFAULT_BASE_URL = '/'

function preProcess (data) {
  data = _concatenateOneOfsAndAnyOfs(data)
  data.api.servers = _getServers(data)
  if (data.baseUrl === '//') {data.baseUrl = DEFAULT_BASE_URL}
  data.host = (data.host || '').replace(/\.$/, '')
  data.resources = _sortTags(data)
  data.version = _getVersion(data)

  data.custom = {
    createTabs,
    evaluateResponses,
    generateCurlExamples,
    generateHclExamples,
    generateJavaScriptExamples,
    generateOapiCliExamples,
    generateOscCliExamples,
    generatePythonExamples,
    getDeprecateState,
    getIntroFirstPart,
    getIntroSecondPart,
    getOperationAuthenticationSchemes,
    getOperationDescription,
    printDescription,
    printEnum,
    printErrorResponses,
    printOperationName,
    printParameterName,
    printPattern,
    printRequired,
    printType,
    supportOperationMultipleExamples,
  }

  return data
}

function _concatenateOneOfsAndAnyOfs (data) {
  const paths = data.api.paths
  for (const operations of Object.values(paths)) {
    _concatenateOneOfsAndAnyOfs2(operations)
    for (const operation of Object.values(operations)) {
      _concatenateOneOfsAndAnyOfs2(operation.requestBody?.content || {})
    }
  }
  _concatenateOneOfsAndAnyOfs2(data.api.components?.schemas)
  _concatenateOneOfsAndAnyOfs2(data.components?.schemas)

  return data
}

function _concatenateOneOfsAndAnyOfs2 (obj) {
  for (const n of Object.values(obj)) {
    const paramsOrProps = n.parameters || Object.values(n.properties || n.schema?.properties || {})
    for (const paramOrProp of paramsOrProps) {
      const p = paramOrProp.schema || paramOrProp
      let xxxOf = p.anyOf || p.oneOf
      if (xxxOf) {
        p['x-types'] = []
        p['x-formats'] = []
        for (const n of xxxOf) {
          for (const [k, v] of Object.entries(n)) {
            if (k === 'type') {
              p['x-types'].push(v)
              if (!p.type) {p.type = v}
            } else if (k === 'format') {
              p['x-formats'].push(v)
              if (!p.format) {p.format = v}
            } else {
              if (p[k]) {}
              else {p[k] = v}
            }
          }
        }
        delete p.anyOf
        delete p.oneOf
      }
      xxxOf = p.items?.anyOf || p.items?.oneOf
      if (xxxOf) {
        p.items['x-types'] = []
        p.items['x-formats'] = []
        for (const n of xxxOf) {
          for (const [k, v] of Object.entries(n)) {
            if (k === 'type') {
              p.items['x-types'].push(v)
              if (!p.items.type) {p.items.type = v}
            } else if (k === 'format') {
              p.items['x-formats'].push(v)
              if (!p.items.format) {p.items.format = v}
            } else {
              if (p.items[k]) {}
              else {p.items[k] = v}
            }
          }
        }
        delete p.items.anyOf
        delete p.items.oneOf
      }
    }
  }
}

function _getServers (data) {
  let content = ''
  const servers = data.api.servers || [{url: DEFAULT_BASE_URL}]
  if (servers) {
    content += '### Endpoints\n\n'
  }
  for (const server of servers) {
    if (server.description) {
      content += server.description + ':\n'
    }
    content += '|Name|Base URL|\n'
    content += '|---|---|\n'
    const entries = Object.entries(server.variables || {})
    const [k, v] = entries[0] || ['', {}]
    for (e of v.enum || ['default']) {
      const url = server.url.replace('{' + k + '}', e).replace(/(\{.+?\})/g, '`$1`')
      content += '|' + e
      if (v.default === e) {
        content += ' (default)'
      }
      if (url === DEFAULT_BASE_URL) {
        content += '|' + url
      } else {
        content += '|[' + url + '](' + url + ')'
      }
      content += '|\n'
    }
    content += '\n'
  }

  return content
}

function _getVersion (data) {
  let version = data.api.info?.version || ''
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
  if (version.match(semverRegex)) {
    version = 'v' + version
  }

  return version
}

function _sortTags (data) {
  const obj = {}
  const keys = Object.keys(data.resources)
  keys.sort((a, b) => {
    if (a === data.translations.defaultTag || b === data.translations.defaultTag) {
      return -1
    } else if (a <= b) {
      return -1
    } else if (a > b) {
      return 1
    }
  })
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    const v = data.resources[k]
    obj[k] = v
  }

  return obj
}

function createTabs (language_tabs) {
  let s = '<div class="lang-selector">\n'
  for (let i = 0, length = language_tabs.length; i < length; i++) {
    const key = Object.keys(language_tabs[i])[0]
    const value = Object.values(language_tabs[i])[0]
    s += '<a href="#" name="' + key + '">' + value + '</a>\n'
  }
  s += '</div>\n'

  return s
}

function evaluateResponses (data) {
  for (const resp in data.operation.responses) {
    if (!resp.startsWith('x-')) {
      const response = data.operation.responses[resp]
      for (const ct in response.content) {
        const contentType = response.content[ct]
        if (contentType.examples || contentType.example) {
          return _getResponseExamples(data)
        } else if (contentType.schema) {
          return data.utils.getResponseExamples(data)
        }
      }
    }
  }
}

function _getResponseExamples (data) {
  let content = ''
  const examples = []
  for (const resp in data.operation.responses) {
    if (!resp.startsWith('x-')) {
      const response = data.operation.responses[resp]
      for (const ct in response.content) {
        const contentType = response.content[ct]
        const cta = [ct]
        // support embedded examples
        if (contentType.examples) {
          for (const ctei in contentType.examples) {
            const example = contentType.examples[ctei]
            examples.push({
              summary: example.summary || response.summary,
              value: _convertExample(example.value),
              cta,
            })
          }
        } else if (contentType.example) {
          examples.push({
            summary: resp + ' ' + data.translations.response,
            value: _convertExample(contentType.example),
            cta,
          })
        }
      }
    }
  }
  let lastDesc = ''
  for (const example of examples) {
    if (example.summary && example.summary !== lastDesc) {
      if (example.summary === examples[0].summary) {
        content += '----details-start open----\n\n'
      } else {
        content += '----details-start----\n\n'
      }
      content += '----summary-start----\n'
      content += '```bash\n'
      content += '# ' + example.summary + '\n'
      content += '```\n\n'
      content += '----summary-end----\n'
      lastDesc = example.summary + '\n'
    }
    if (_doContentType(example.cta, 'json')) {
      content += '```json\n'
      content += data.utils.safejson(example.value, null, 2) + '\n'
      content += '```\n\n'
    }
    if (_doContentType(example.cta, 'yaml')) {
      content += '```yaml\n'
      content += yaml.stringify(example.value) + '\n'
      content += '```\n\n'
    }
    if (_doContentType(example.cta, 'text')) {
      content += '```\n'
      content += JSON.stringify(example.value) + '\n'
      content += '```\n\n'
    }
    let xmlObj = example.value
    if (example.xmlWrap) {
      xmlObj = {}
      xmlObj[example.xmlWrap] = example.value
    }
    if (typeof xmlObj === 'object' && _doContentType(example.cta, 'xml')) {
      content += '```xml\n'
      content += xml.getXml(JSON.parse(data.utils.safejson(xmlObj)), '@', '', true, '  ', false) + '\n'
      content += '```\n\n'
    }
    if (example.summary && example.summary !== lastDesc) {
      content += '----details-end----\n\n'
    }
  }

  return content
}

function _convertExample (ex) {
  if (typeof ex === 'string') {
    try {
      return yaml.parse(ex)
    } catch (e) {
      return ex
    }
  } else {
    return ex
  }
}

function _doContentType (ctTypes, ctClass) {
  const contentTypes = {
    xml: ['^(application|text|image){1}\\/(.*\\+){0,1}xml(;){0,1}(\\s){0,}(charset=.*){0,}$'],
    json: ['^(application|text){1}\\/(.*\\+){0,1}json(;){0,1}(\\s){0,}(charset=.*){0,}$'],
    yaml: ['application/x-yaml', 'text/x-yaml'],
    form: ['multipart/form-data', 'application/x-www-form-urlencoded', 'application/octet-stream'],
    text: ['text/plain', 'text/html'],
  }
  for (const type of ctTypes) {
    for (const target of contentTypes[ctClass] || []) {
      if (type.match(target)) return true
    }
  }
  return false
}

function getDeprecateState (description) {
  const match = description?.match('Deprecated:')
  if (match) {
    // Placeholder tag which is further transformed by antora-extension/lib/generate_api_docs_files.js
    return '----Deprecated----'
  }
  return ''
}

function getIntroFirstPart (description) {
  return description.split('# Authentication Schemes').slice(0, 1)
}

function getIntroSecondPart (description) {
  const s = description.split('# Authentication Schemes')
  if (s.length > 1) {
    return '# Authentication Schemes' + s.slice(-1)
  } else {
    return null
  }
}

function getOperationAuthenticationSchemes (data) {
  let list = ''
  for (const s in data.security) {
    let count = 0
    const keys = Object.keys(data.security[s])
    for (const sse in keys) {
      let secName = keys[sse]
      if (secName === 'ApiKeyAuth' || secName === 'ApiKeyAuthSec') {
        secName = 'access key/secret key'
      } else if (secName === 'BasicAuth') {
        secName = 'login/password'
      }
      const sep = count > 0 ? ' & ' : ' or '
      list += (list ? sep : '') + '<a href="#authentication-schemes">' + secName + '</a>'
      const scopes = data.security[s][secName]
      if (Array.isArray(scopes) && scopes.length > 0) {
        list += ' ( ' + data.translations.secDefScopes + ': '
        for (const scope in scopes) {
          list += scopes[scope] + ' '
        }
        list += ')'
      }
      count++
    }
    if (count === 0) {
      // 'null' security
      list += (list ? ', ' : '') + data.translations.secDefNone
    }
  }

  return list
}

function getOperationDescription (data) {
  if (!data.operation.description) {
    data.operation.description = data.method.pathItem.description
  }

  return data.operation.description
}

function printDescription (description) {
  if (description) return description.replace(/\n/g, '').replace(/(&lt;.*?&gt;)/g, '`$1`')
  else return ''
}

function printEnum (p) {
  let s = ''
  if (p.schema.enum) {
    s += '<br />Possible values: `' + p.schema.enum.join('`, `') + '`.'
  }

  return s
}

function printErrorResponses (responses) {
  let s = ''
  if (responses.length) {
    s += 'Other responses:\n'
    for (const response of responses) {
      s += '* **Response ' + response.status + '** (' + response.schema + ')'
      if (response.description) {
        s += ': ' + response.description
      }
      s += '\n'
    }
  }

  return s
}

function printOperationName (operationUniqueName) {
  return operationUniqueName.split('__').slice(-1)[0]
}

function printParameterName (s) {
  const pattern = '**additionalProperties**'
  const replacement = '*additional properties*'
  if (s.includes(pattern)) {
    return s.replace(pattern, replacement)
  } else {
    return s
  }
}

function printPattern (p) {
  let s = p.schema.items?.pattern || p.schema.pattern || ''
  if (s) {
    s = s.replace(/\|/g, '\\|')
    s = '<br /><span>Pattern: `' + s + '`</span>'
  }

  return s
}

function printRequired (boolean) {
  if (boolean) {
    return ' <mark>(required)</mark>'
  } else {
    return ''
  }
}

function printType (p) {
  let s = p.safeType
  let xTypes = p.schema['x-types'] || []
  const xTypesCount = [...new Set(xTypes)].length

  if (p.schema['items'] && p.schema.items['x-types']) {
    xTypes = [...new Set(p.schema.items['x-types'])]
    s = xTypes.join(' or ')
    if (!s.endsWith('null') && p.schema.items['x-formats'].length) {
      xFormats = [...new Set(p.schema.items['x-formats'])]
      s += ' (' + xFormats.join(' or ') + ')'
    }
    s = '[' + s + ']'
  }

  if (p.schema['x-types']) {
    xTypes = [...new Set(p.schema['x-types'])]
    s = xTypes.join(' or ')
    if (!s.endsWith('null') && p.schema['x-formats'].length) {
      xFormats = [...new Set(p.schema['x-formats'])]
      s += ' (' + xFormats.join(' or ') + ')'
    }
  }

  if (xTypesCount > 1) {
    s = s.replace(p.type, p.safeType)
    s = s.replace('object', p.safeType)
    s = s.replace('array', p.safeType)
  }
  s = s.replace(/\b\(/, ' (')
  s = s.replace(/\)\(/, ') (')
  s = s.replace('¦null', ' or null')

  return s
}

function supportOperationMultipleExamples (data) {
  const op = data.method.operation
  if (op.requestBody) {
    for (const rb in op.requestBody.content) {
      const examples = op.requestBody.content[rb].examples
      if (examples) {
        let key = Object.keys(examples)[0]
        data['x-customRequestExamples'] = []
        for (let i = 0, length = Object.keys(examples).length; i < length; i++) {
          key = Object.keys(examples)[i]
          data['x-customRequestExamples'].push({
            object: examples[key].value,
            summary: examples[key].summary,
          })
        }
      } else {
        data['x-customRequestExamples'] = [{ object: data.bodyParameter.exampleValues.object }]
      }
    }
  }

  return data
}

module.exports = preProcess
