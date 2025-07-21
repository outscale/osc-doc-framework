const querystring = require('querystring')
const circularClone = require('reftools/lib/clone.js').circularClone
const jptr = require('reftools/lib/jptr.js').jptr
const recurse = require('reftools/lib/recurse.js').recurse
const sampler = require('openapi-sampler')
const visit = require('reftools/lib/visit.js').visit
const walkSchema = require('oas-schema-walker').walkSchema
const wsGetState = require('oas-schema-walker').getDefaultState
const generateCurlExamples = require('./code_curl')
const generateHclExamples = require('./code_hcl')
const generateHttpExamples = require('./code_http')
const generateJavaScriptExamples = require('./code_javascript')
const generateOapiCliExamples = require('./code_oapi-cli')
const generateOscCliExamples = require('./code_osc-cli')
const generatePythonExamples = require('./code_python')
const xml = require('jgexml/json2xml.js')

const DEFAULT_BASE_URL = '/'

function preProcess (data) {
  if (data.baseUrl === '//') {data.baseUrl = DEFAULT_BASE_URL}
  data.host = computeApiHost(data)
  data.resources = _sortTags(data)
  data.version = _getVersion(data)

  data.custom = {
    createTabs,
    fakeBodyParameter,
    generateAuthenticationSchemesSection,
    generateCurlExamples,
    generateHclExamples,
    generateHttpExamples,
    generateJavaScriptExamples,
    generateOapiCliExamples,
    generateOscCliExamples,
    generatePythonExamples,
    generateServersSection,
    getDeprecateState,
    getIntroFirstPart,
    getIntroSecondPart,
    getOperationAuthenticationSchemes,
    getOperationDescription,
    getResponses,
    getResponseExamples,
    isAGatewayApi,
    mergeXxxOfRowsIntoSingleBlock,
    printDescription,
    printErrorResponses,
    printOperationName,
    printParameterName,
    printRequired,
    printType,
    schemaToArray,
    supportOperationMultipleExamples,
    urlEncode,
  }

  return data
}

function computeApiHost (data) {
  let host = ''
  if (data.servers) {
    const serverUrl = data.servers[0]?.url
    if (!serverUrl.startsWith('/')) {
      host = new URL(serverUrl).host
    }
  }

  return host
}

function _getVersion (data) {
  let version = data.api.info?.version || ''
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*))*(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
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
  let s = ''
  for (let i = 0, length = language_tabs.length; i < length; i++) {
    const key = Object.keys(language_tabs[i])[0]
    const value = Object.values(language_tabs[i])[0]
    if (value) {
      s += '<a href="#" name="' + key + '">' + value + '</a>\n'
    }
  }
  if (s) {
    s = '<div class="lang-selector">\n' + s + '</div>\n'
  }

  return s
}

// Modified from Widdershins
function fakeBodyParameter(data) {
  if (!data.parameters) data.parameters = []
  let bodyParams = []
  if (data.bodyParameter.schema) {
    let param = {}
    param.in = 'body'
    param.schema = data.bodyParameter.schema
    param.name = 'body'
    if (data.operation.requestBody) {
      param.required = data.operation.requestBody.required || false
      param.description = data.operation.requestBody.description
      if (data.options.useBodyName && data.operation['x-body-name']) {
        param.name = data.operation['x-body-name']
      }
    }
    param.refName = data.bodyParameter.refName
    if (!data.options.omitBody || param.schema["x-widdershins-oldRef"]) {
      bodyParams.push(param)
    }

    if ((param.schema.type === 'object') && (data.options.expandBody || (!param.schema["x-widdershins-oldRef"]))) {
      let offset = (data.options.omitBody ? -1 : 0)
      let props = schemaToArray(data.bodyParameter.schema, offset, { trim: true }, data)

      for (let block of props) {
        for (let prop of block.rows) {
          let param = {}
          param.in = 'body'
          param.schema = prop.schema
          param.name = prop.displayName
          param.required = prop.required
          param.description = prop.description
          param.safeType = prop.safeType
          param.depth = prop.depth
          bodyParams.push(param)
        }
      }
    }

    if (!data.parameters || !Array.isArray(data.parameters)) data.parameters = []
    data.parameters = data.parameters.concat(bodyParams)
  }
}

function generateAuthenticationSchemesSection (data) {
  let s = ''
  const securitySchemes = data.api.components?.securitySchemes || {}
  const securityRequirements = _getAllSecurityRequirements(data.api.security || [], securitySchemes)
  if (securityRequirements.length > 1) {
    s = 'There are ' + securityRequirements.length + ' possible ways to authenticate your requests with'
    if (data.api.info?.title) {
      s += ' the ' + data.api.info?.title + ':\n\n'
    } else {
      s == ' this API:\n\n'
    }
  }
  for (const requirement of securityRequirements) {
    s += '### ' + _formatSecurityRequirementName(requirement, data.host, data.api.info?.title, false) + '\n\n'
    s += '|Element|Description|\n'
    s += '|---|---|\n'
    for (const n in requirement) {
      const [_, v] = Object.entries(securitySchemes).filter(([schemeName, _]) => schemeName === n)[0]
      if (v.type === 'apiKey') {
        s += '|`' + v.name + '` ' + v.in + '|' + (v.description || '') + '|\n'
      } else if (v.type === 'http') {
        if (v.scheme === 'basic') {
          s += '|`Authorization` header'
        } else {
          if (v.bearerFormat) {
            s += v.bearerFormat + ' '
          }
          s += v.scheme
        }
        s += '|' + v.description + '|\n'
      } else if (v.type === 'mutualTLS') {
        s += '|' + v.type + '|' + (v.description || '') + '|\n'
      } else if (v.type === 'oauth2') {
        s += '|' + v.type + '|' + (v.description || '')
        if (v.description && v.flows) {
          s += '<br />'
        }
        for (const [k2, v2] of Object.entries(v.flows)) {
          s += _unPascalCase(k2) + ' flow:<br />'
          for (const [k3, v3] of Object.entries(v2)) {
            s += '- ' + _unPascalCase(k3) + ': '
            if (typeof v3 === 'object') {
              let scopes = []
              for (const [k4, v4] of Object.entries(v3)) {
                scopes.push('`' + k4 + '` (' + v4 + ')')
              }
              s += scopes.join(', ') + '<br />'
            } else {
              s += v3 + '<br />'
            }
          }
        }
        s += '|\n'
      } else if (v.type === 'openIdConnect') {
        s += '|' + v.type + '|' + (v.description || '')
        s += '<br />' + openIdConnectUrl + '|\n'
      } else {
        s += '|' + v.type + '|' + (v.description || '') + '|\n'
      }
    }
    s += '\n\n'
  }

  return s
}

function _getAllSecurityRequirements (securityRequirements, securitySchemes) {
  const keys = Object.keys(securitySchemes)
  for (const k of keys) {
    if (securityRequirements.filter((subarray) => Object.keys(subarray).includes(k)).length === 0) {
      const obj = {}
      obj[k] = []
      securityRequirements.push(obj)
    }
  }

  return securityRequirements
}

function _formatSecurityRequirementName (array, host, apiTitle, lowerCase) {
  let name = Object.keys(array).join('/')
  if (isAGatewayApi(host)) {
    if (name === 'ApiKeyAuth' || name === 'ApiKeyAuthSec' || name === 'aksk') {
      name = 'Access Key/Secret Key'
    } else if (name === 'BasicAuth') {
      name = 'Login/Password'
    }
  } else if (apiTitle === 'OKS API' || host.includes('oks.outscale.')) {
    name = name.replace(/\B([A-Z][a-z])/g, " $1")
    name = name.replace(/Basic Auth/g, 'Basic Authentication').replace(/ Auth\b/g, '')
    name = name.replace(/\/OTP Code/g, '')
  }
  if (lowerCase) {
    name = name.replace(/([A-Z][a-z])/g, (x) => x.toLowerCase())
  }

  return name
}

function _unPascalCase (s) {
  s = s.replace(/([A-Z])/g, " $1").toLowerCase().replaceAll('url', 'URL')

  return _capitalize(s)
}

function generateServersSection (servers) {
  let s = ''
  if (servers) {
    s += '### Endpoints\n\n'
    if (servers.filter((x) => x.description).length) {
      s += '|Base URL|Description|\n'
      s += '|---|---|\n'
    } else {
      s += '|Base URL|\n'
      s += '|---|\n'
    }
    for (const server of servers) {
      const entries = Object.entries(server.variables || {})
      const [k, v] = entries[0] || ['', {}]
      for (e of v.enum || [v.default]) {
        if (server.url === DEFAULT_BASE_URL) {
          s += '|' + DEFAULT_BASE_URL + '|'
        } else {
          const server_text = server.url.replace('{' + k + '}', '`' + e + '`')
          const server_url = server.url.replace('{' + k + '}', e)
          s += '|[' + server_text + '](' + server_url + ')|'
        }
        s += (server.description || '') + '|\n'
      }
    }
  }

  return s
}

function getDeprecateState (obj) {
  const match = obj.deprecated || obj.schema?.deprecated || obj.description?.match('Deprecated:')
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
  const list = []
  const securityRequirements = data.operation.security || data.security
  for (const requirement of securityRequirements) {
    let name = _formatSecurityRequirementName(requirement, data.host, data.api.info?.title, true)
    name = '<a href="#authentication-schemes">' + name + '</a>'
    for (const v of Object.values(requirement)) {
      if (v.length) {
        name += ' (<code>' + v.join('</code>, <code>') + '</code>)'
      }
    }
    list.push(name)
  }
  if (list.length <= 2) {
    return list.join(' or ')
  } else {
    return list.join(', or ')
  }
}

function getOperationDescription (data) {
  if (!data.operation.description) {
    data.operation.description = data.method.pathItem.description
  }

  return data.operation.description
}

// Modified from Widdershins
function getResponses(data) {
  let responses = [];
  for (let r in data.operation.responses) {
      if (!r.startsWith('x-')) {
          let response = data.operation.responses[r]
          let entry = {}
          entry.status = r
          entry.meaning = (r === 'default' ? data.translations.responseDefault : data.translations.responseUnknown)
          entry.description = (typeof response.description === 'string' ? response.description.trim() : undefined)
          entry.schema = data.translations.schemaNone
          for (let ct in response.content) {
              let contentType = response.content[ct]
              if (contentType.schema) {
                  entry.type = contentType.schema.type
                  entry.schema = data.translations.schemaInline
              }
              if (contentType.schema && contentType.schema["x-widdershins-oldRef"]?.startsWith('#/components/')) {
                  let schemaName = contentType.schema["x-widdershins-oldRef"].replace('#/components/schemas/', '')
                  entry.schema = '[' + schemaName + '](#schema' + schemaName.toLowerCase() + ')'
                  entry.$ref = true
              }
              else if (contentType.schema?.items && contentType.schema.items["x-widdershins-oldRef"]?.startsWith('#/components/')) {
                  let schemaName = contentType.schema.items["x-widdershins-oldRef"].replace('#/components/schemas/', '')
                  entry.schema = '[' + schemaName + '](#schema' + schemaName.toLowerCase() + ')'
                  entry.$ref = true
              }
              else if (response["x-widdershins-oldRef"]) {
                  let schemaName = response["x-widdershins-oldRef"].replace('#/components/responses/', '')
                  entry.schema = '[' + schemaName + '](#schema' + schemaName.toLowerCase() + ')'
                  entry.$ref = true
              }
          }
          entry.content = response.content
          entry.links = response.links
          responses.push(entry)
      }
  }
  return responses
}

// Modified from Widdershins
function getResponseExamples (data) {
  let content = ''
  const examples = []
  let autoDone = {}
  const firstContentKey = Object.keys(data.operation.responses)[0]
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
        } else if (resp === firstContentKey && contentType.example) {
          examples.push({
            summary: _capitalize(resp) + ' response',
            value: _convertExample(contentType.example),
            cta,
          })
        } else if (resp === firstContentKey && contentType.schema) {
          let obj = contentType.schema
          let autoCT = ''
          if (_doContentType(cta, 'json')) autoCT = 'json'
          if (_doContentType(cta, 'yaml')) autoCT = 'yaml'
          if (_doContentType(cta, 'xml')) autoCT = 'xml'
          if (_doContentType(cta, 'text')) autoCT = 'text'

          if (!autoDone[autoCT]) {
              autoDone[autoCT] = true
              let xmlWrap = false
              if (obj && obj.xml && obj.xml.name) {
                  xmlWrap = obj.xml.name
              }
              else if (obj["x-widdershins-oldRef"]) {
                  xmlWrap = obj["x-widdershins-oldRef"].split('/').pop()
              }
              examples.push({ value: _getSample(obj, data.options, { skipWriteOnly: true, quiet: true }, data.api, data), cta: cta, xmlWrap: xmlWrap })
          }
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
      content += data.utils.safejson(example.value || {}, null, 2) + '\n'
      content += '```\n\n'
    }
    if (_doContentType(example.cta, 'yaml')) {
      content += '```yaml\n'
      content += yaml.stringify(example.value || {}) + '\n'
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

// Modified from Widdershins
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

// Modified from Widdershins
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

// Modified from Widdershins
function _getSample(orig, options, samplerOptions, api,data){
  if (orig && orig.example) return orig.example
  if (orig && orig.examples) return orig.examples[0]
  let result = _getSampleInner(orig,options,samplerOptions,api,data)
  result = _clean(result)
  result = _strim(result,options.maxDepth)
  return result
}

// Modified from Widdershins
function _getSampleInner(orig,options,samplerOptions,api,data){
  if (!options.samplerErrors) options.samplerErrors = new Map()
  let obj = circularClone(orig)
  let defs = api //Object.assign({},api,orig)
  if (options.sample && obj) {
    try {
      var sample = sampler.sample(obj,samplerOptions,defs); // was api
      if (sample && typeof sample.$ref !== 'undefined') {
        obj = JSON.parse(data.utils.safejson(orig))
        sample = sampler.sample(obj,samplerOptions,defs)
      }
      if (typeof sample !== 'undefined') {
        if (sample !== null && Object.keys(sample).length) return sample
        else {
          return sampler.sample({ type: 'object', properties: { anonymous: obj}},samplerOptions,defs).anonymous
        }
      }
    }
    catch (ex) {
      if (options.samplerErrors.has(ex.message)) {
        process.stderr.write('.')
      }
      else {
        console.error('# sampler ' + ex.message)
        options.samplerErrors.set(ex.message,true)
        if (options.verbose) {
          console.error(ex)
        }
      }
      obj = JSON.parse(data.utils.safejson(orig))
      try {
        sample = sampler.sample(obj,samplerOptions,defs)
        if (typeof sample !== 'undefined') return sample
      }
      catch (ex) {
        if (options.samplerErrors.has(ex.message)) {
          process.stderr.write('.')
        }
        else {
          console.warn('# sampler 2nd error ' + ex.message)
          options.samplerErrors.set(ex.message,true)
        }
      }
    }
  }
  return obj
}

// Modified from Widdershins
function _clean(obj) {
  if (typeof obj === 'undefined') return {}
  visit(obj,{},{filter:function(obj,key,state){
    if (!key.startsWith('x-widdershins')) return obj[key]
  }})
  return obj
}

// Modified from Widdershins
function _strim(obj,maxDepth) {
  if (maxDepth <= 0) return obj
  recurse(obj,{identityDetection:true},function(obj,key,state){
    if (state.depth >= maxDepth) {
      if (Array.isArray(state.parent[state.pkey])) {
        state.parent[state.pkey] = []
      }
      else if (typeof state.parent[state.pkey] === 'object') {
        state.parent[state.pkey] = {}
      }
    }
  })
  return obj
}

function isAGatewayApi (host) {
  return (
    (host.startsWith('api') && !host.includes('oks')) ||
    host.startsWith('okms') ||
    host.startsWith('fcu') ||
    host.startsWith('lbu') ||
    host.startsWith('eim') ||
    host.startsWith('directlink') ||
    host.startsWith('icu') ||
    host.startsWith('kms')
  )
}

function mergeXxxOfRowsIntoSingleBlock (blocks) {
  for (let i = 1, length = blocks.length; i < length; i++) {
    blocks[0].rows.push(...blocks[i].rows)
    blocks[i].rows = []
  }

  return blocks
}

function printDescription (p, host) {
  let s = ''

  // Expand the description by reading the other OpenAPI keywords of the schema
  let array = []
  let valueDefault
  let valueExamples
  array = pushValueMinItemsMaxItems(array, p.schema)
  array = pushValueLength(array, p.schema)
  array = pushValuePattern(array, p.schema)
  array = pushValueMultipleOf(array, p.schema)
  array = pushValueMinimumMaximum(array, p.schema)
  array = pushValueEnum(array, p.schema)

  valueDefault = getValueDefault(p.schema)
  if (valueDefault) {
    array.push(valueDefault)
  }

  valueExamples = getValueExamples(p)

  // array = pushParameterParameterFields(array, p)
  array = pushValueConst(array, p.schema)

  const arrayTotal = []
  if (p.description) {
    arrayTotal.push(p.description)
  }
  if (array.length) {
    arrayTotal.push(array.join('. ') + '.')
  }
  if (valueExamples && valueDefault.replace('Default: ', '') !== valueExamples.replace(/^Examples?: /, '')) {
    arrayTotal.push(valueExamples + '.')
  }
  if (arrayTotal.length) {
    s = arrayTotal.join('<br />')
  }

  if (s) {
    s = s.replace(/\n|<br>/g, '')
    s = s.replace(/\|/g, '\\|')
  }

  return s
}

function pushValueMinItemsMaxItems (array, schema) {
  let minItems = schema.items?.minItems || schema.minItems
  let maxItems = schema.items?.maxItems || schema.maxItems

  if (minItems !== undefined && maxItems !== undefined) {
    array.push('Array size: ' + minItems + ' to ' + maxItems + ' items')
  } else if (minItems !== undefined) {
    let s = 's'
    if (minItems === 1) {s = ''}
    array.push('Array size: minimum ' + minItems + ' item' + s)
  } else if (maxItems !== undefined) {
    let s = 's'
    if (minItems === 1) {s = ''}
    array.push('Array size: maximum ' + maxItems + ' item' + s)
  }

  return array
}

function pushValueLength (array, schema) {
  let minLength = schema.items?.minLength || schema.minLength
  let maxLength = schema.items?.maxLength || schema.maxLength

  if (minLength !== undefined && maxLength !== undefined) {
    array.push('Length: ' + minLength + ' to ' + maxLength + ' characters')
  } else if (minLength !== undefined) {
    let s = 's'
    if (minLength === 1) {s = ''}
    array.push('Length: minimum ' + minLength + ' character' + s)
  } else if (maxLength !== undefined) {
    let s = 's'
    if (minLength === 1) {s = ''}
    array.push('Length: maximum ' + maxLength + ' character' + s)
  }

  return array
}

function pushValuePattern (array, schema) {
  let pattern = schema.items?.pattern || schema.pattern

  if (pattern !== undefined) {
    array.push('Pattern: `' + pattern + '`')
  }

  return array
}

function pushValueMultipleOf (array, schema) {
  let multipleOf = schema.items?.multipleOf || schema.multipleOf

  if (multipleOf !== undefined) {
    array.push('Multiple of: ' + multipleOf + '')
  }

  return array
}

function pushValueMinimumMaximum (array, schema) {
  let minimum = schema.items?.minimum || schema.minimum
  let maximum = schema.items?.maximum || schema.maximum

  if (minimum !== undefined) {
    let parenthesis = ''
    if (schema.items?.exclusiveMinimum || schema.exclusiveMinimum) {
      parenthesis = ' (exclusive)'
    }
    array.push('Minimum value: `' + minimum + '`' + parenthesis)
  }

  if (maximum !== undefined) {
    let parenthesis = ''
    if (schema.items?.exclusiveMaximum || schema.exclusiveMaximum) {
      parenthesis = ' (exclusive)'
    }
    array.push('Maximum value: `' + maximum + '`' + parenthesis)
  }

  return array
}

function pushValueEnum (array, schema) {
  let enums = schema.items?.enum || schema.enum

  if (enums !== undefined) {
    array.push('Possible values: `' + enums.join('` | `') + '`')
  }

  return array
}

function getValueDefault (schema) {
  let s = ''
  let v = schema.items?.default || schema.default

  if (v !== undefined) {
    s = 'Default: ' + _formatInlineCode(v)
  }

  return s
}

function getValueExamples (obj) {
  let s = ''
  let v = (
    obj.items?.examples ||
    obj.items?.example ||
    obj.examples ||
    obj.example ||
    obj.schema?.items?.examples ||
    obj.schema?.items?.example ||
    obj.schema?.examples ||
    obj.schema?.example
  )

  if (v !== undefined) {
    if (Array.isArray(v)) {
      if (v.length > 1) {
        for (let i = 0, length = v.length; i < length; i++) {
          v[i] = _formatInlineCode(v[i])
        }
        s = 'Examples: ' + v.join(', ')
      } else {
        s = 'Example: ' + _formatInlineCode(v[0])
      }
    } else {
      s = 'Example: ' + _formatInlineCode(v)
    }
  }

  return s
}

function _formatInlineCode (v) {
  // https://stackoverflow.com/a/57467694
  v = JSON.stringify(v, null, 1) // stringify, with line-breaks and indents
  v = v.replace(/^ +/gm, ' ') // remove all but the first space for each line
  v = v.replace(/\n/g, '') // remove line-breaks
  v = v.replace(/{ /g, '{').replace(/ }/g, '}') // remove spaces between object-braces and first/last props
  v = v.replace(/\[ /g, '[').replace(/ \]/g, ']') // remove spaces between array-brackets and first/last items

  v = v.replace(/^"/, '').replace(/"$/, '') // remove quotes if it's a single string

  if (v === 'true' || v === 'false') {
    return v
  } else if (v) {
    return '`' + v + '`'
  } else {
    return '<code></code>'
  }
}

// function pushParameterParameterFields (array, obj) {
//   if ('style' in obj) {
//     array.push('Style: `' + obj.style + '`')
//   }
//   if ('explode' in obj) {
//     array.push('Explode: `' + obj.explode + '`')
//   }
//   if ('allowReserved' in obj) {
//     array.push('Allow reserved: `' + obj.allowReserved + '`')
//   }

//   return array
// }

function pushValueConst (array, schema) {
  let constant = schema.items?.const || schema.const

  if (constant !== undefined) {
    array.push('Value: `' + constant + '`')
  }

  return array
}

function printErrorResponses (responses, translations) {
  let s = ''
  if (responses.length) {
    s += 'Other responses:\n'
    for (const response of responses) {
      s += '* **' + _capitalize(response.status) + ' response**'
      if (response.schema !== translations.schemaNone) {
        response.safeType = response.schema
        s += ' (' + printType(response) + ' ' + response.type + ')'
      }
      if (response.description) {
        s += ': ' + response.description
      }
      s += '\n'
    }
  }

  return s
}

function _capitalize (s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
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

function printRequired (boolean) {
  if (boolean) {
    return ' <mark>(required)</mark>'
  } else {
    return ''
  }
}

function printType (p) {
  let s = p.safeType

  if (p.safeType.startsWith('[#/paths/')) {
    s = p.type
  } else {
    if (p.schema && p.schema['x-widdershins-oldRef'] && p.schema.type) {
      s = p.safeType + ' ' + p.schema.type
    }
    if (p.schema?.items && p.schema.items['x-widdershins-oldRef'] && p.schema.items.type) {
      s = '[' + p.safeType.slice(1, -1) + ' ' + p.schema.items.type + ']'
    }
  }

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
  s = s.replace('array[', '[')
  s = s.replace(/( \(.+?\))( (?!or).+?)\b/g, '$2$1')

  return s
}

// Modified from Widdershins
function schemaToArray(schema,offset,options,data) {
  let iDepth = 0
  let oDepth = 0
  let blockDepth = 0
  let skipDepth = -1
  let container = []
  let depthQueue = new Map()
  let block = { title: '', rows: [] }
  if (schema) {
    block.description = schema.description
    if (schema.externalDocs)
      block.externalDocs = schema.externalDocs
  }
  container.push(block)
  let wsState = wsGetState()
  wsState.combine = true
  wsState.allowRefSiblings = true
  walkSchema(schema,{},wsState,function(schema,parent,state){
    if (schema.items?.properties && !schema.items["x-widdershins-oldRef"]) {
      schema.items["x-widdershins-oldRef"] = ""
    }
    else if (schema.properties && !schema["x-widdershins-oldRef"]) {
      schema["x-widdershins-oldRef"] = ""
    }

    state.seen.delete(schema)

    if (schema.items && schema.items['x-widdershins-oldRef'] === schema['x-widdershins-oldRef']) {
      state.seen.set(schema)
    }

    let isBlock = false
    if (state.property && (state.property.startsWith('allOf') || state.property.startsWith('anyOf') || state.property.startsWith('oneOf') || (state.property === 'not'))) {
      isBlock = true
      let components = (state.property+'/0').split('/')
      if (components[1] !== '0') {
        if (components[0] === 'allOf') components[0] = 'and'
        if (components[0] === 'anyOf') components[0] = 'or'
        if (components[0] === 'oneOf') components[0] = 'xor'
      }
      block = { title: components[0], rows: [] }
      let dschema = schema
      let prefix = ''
      if (schema.$ref) {
        dschema = jptr(data.api,schema.$ref)
        prefix = schema.$ref.replace('#/components/schemas/','')+'.'
      }
      if (dschema.discriminator) {
        block.title += ' - discriminator: '+prefix+dschema.discriminator.propertyName
      }
      container.push(block)
      blockDepth = state.depth
    }
    else {
      if (blockDepth && state.depth < blockDepth) {
        block = { title: data.translations.continued, rows: [] }
        container.push(block)
        blockDepth = 0
      }
    }

    let entry = {}
    entry.schema = schema
    entry.in = 'body'
    if (state.property && state.property.indexOf('/')) {
      if (isBlock) {
        if (schema.title) {
          entry.name = '*'+state.property+' ('+schema.title+')*'
        } else {
          entry.name = '*'+state.property+'*'
        }
      }
      else entry.name = state.property.split('/')[1]
    }
    else if (!state.top) console.warn(state.property)
    // if (!entry.name && schema.title) {
    //   entry.name = '*item*'
    //   if (schema.type === 'array') entry.name = '*array*'
    // }

    if (schema.type === 'array' && schema.items && schema.items["x-widdershins-oldRef"] && !entry.name) {
      state.top = false; // force it in
    }
    else if (schema.type === 'array' && schema.items && schema.items.$ref && !entry.name) {
      state.top = false; // force it in, for un-dereferenced schemas
    }
    else if (!entry.name && state.top && schema.type && schema.type !== 'object' && schema.type !== 'array') {
      state.top = false
    }

    if (!state.top && !entry.name && state.property === 'additionalProperties') {
      entry.name = '**additionalProperties**'
    }
    if (!state.top && !entry.name && state.property === 'additionalItems') {
      entry.name = '**additionalItems**'
    }
    if (!state.top && !entry.name && state.property && state.property.startsWith('patternProperties')) {
      entry.name = '*'+entry.name+'*'
    }
    if (!state.top && !entry.name && !parent.items) {
      entry.name = '*'+data.translations.anonymous+'*'
    }

    // we should be done futzing with entry.name now

    if (entry.name) {
      if (state.depth > iDepth) {
        let difference = state.depth - iDepth
        depthQueue.set(iDepth, difference)
        oDepth++
      }
      if (state.depth < iDepth) {
        let keys = depthQueue.keys()
        let next = keys.next()
        let difference = 0
        while (!next.done) {
          if (next.value >= state.depth) {
            let depth = depthQueue.get(next.value)
            depth = depth % 2 == 0 ? depth/2 : depth
            difference += depth
            depthQueue.delete(next.value)
          }
          next = keys.next()
        }
        oDepth -= difference
        if (oDepth<0) oDepth=0
      }
      iDepth = state.depth
      //console.warn('state %s, idepth %s, odepth now %s, offset %s',state.depth,iDepth,oDepth,offset)
    }

    entry.depth = Math.max(oDepth+offset,0)
    entry.description = schema.description
    entry.type = schema.type
    entry.format = schema.format
    entry.safeType = entry.type

    if (schema["x-widdershins-oldRef"]) {
      entry.$ref = schema["x-widdershins-oldRef"].replace('#/components/schemas/','')
      entry.safeType = '['+entry.$ref+'](#schema'+entry.$ref.toLowerCase()+')'
      if (data.options.shallowSchemas) skipDepth = entry.depth
      if (!entry.description) {
        let target = jptr(data.api,schema["x-widdershins-oldRef"])
        if (target.description) entry.description = target.description
      }
    }
    if (schema.$ref) { // repeat for un-dereferenced schemas
      entry.$ref = schema.$ref.replace('#/components/schemas/','')
      entry.type = '$ref'
      entry.safeType = '['+entry.$ref+'](#schema'+entry.$ref.toLowerCase()+')'
      if (data.options.shallowSchemas) skipDepth = entry.depth
      if (!entry.description) {
        let target = jptr(data.api,schema.$ref)
        if (target.description) entry.description = target.description
      }
    }

    if (entry.format) entry.safeType = entry.safeType+'('+entry.format+')'
    if ((entry.type === 'array') && schema.items) {
      let itemsType = schema.items.type||'any'
      if (schema.items["x-widdershins-oldRef"]) {
        let $ref = schema.items["x-widdershins-oldRef"].replace('#/components/schemas/','')
        itemsType = '['+$ref+'](#schema'+$ref.toLowerCase()+')'
        if (!entry.description) {
          let target = jptr(data.api,schema.items["x-widdershins-oldRef"])
          if (target.description) entry.description = '['+target.description+']'
        }
      }
      if (schema.items.$ref) { // repeat for un-dereferenced schemas
        let $ref = schema.items.$ref.replace('#/components/schemas/','')
        itemsType = '['+$ref+'](#schema'+$ref.toLowerCase()+')'
        if (!entry.description) {
          let target = jptr(data.api,schema.items.$ref)
          if (target.description) entry.description = '['+target.description+']'
        }
      }
      if (schema.items.anyOf) itemsType = 'anyOf'
      if (schema.items.allOf) itemsType = 'allOf'
      if (schema.items.oneOf) itemsType = 'oneOf'
      if (schema.items.not) itemsType = 'not'
      entry.safeType = '['+itemsType+']'
    }

    if (options.trim && typeof entry.description === 'string') {
      entry.description = entry.description.trim()
    }
    if (options.join && typeof entry.description === 'string') {
      entry.description = entry.description.split('\r').join('').split('\n').join('<br>')
    }
    if (options.truncate && typeof entry.description === 'string') {
      entry.description = entry.description.split('\r').join('').split('\n')[0]
    }
    if (entry.description === 'undefined') { // yes, the string
      entry.description = ''
    }

    if (schema.nullable === true) {
      entry.safeType += '¦null'
    }

    if (schema.readOnly) entry.restrictions = data.translations.readOnly
    if (schema.writeOnly) entry.restrictions = data.translations.writeOnly

    entry.required = (parent.required && Array.isArray(parent.required) && parent.required.indexOf(entry.name)>=0)
    if (typeof entry.required === 'undefined') entry.required = false

    if (typeof entry.type === 'undefined') {
      entry.type = _inferType(schema)
      entry.safeType = entry.type
    }

    if (typeof entry.name === 'string' && entry.name.startsWith('x-widdershins-')) {
      entry.name = ''; // reset
    }
    if ((skipDepth >= 0) && (entry.depth >= skipDepth)) entry.name = ''; // reset
    if (entry.depth < skipDepth) skipDepth = -1
    entry.displayName = (data.translations.indent.repeat(entry.depth)+' '+entry.name).trim()

    if ((!state.top || entry.type !== 'object') && (entry.name)) {
      block.rows.push(entry)
    }
  })
  return container
}

// Modified from Widdershins
function _inferType(schema) {

  function has(properties) {
    for (let property of properties) {
      if (typeof schema[property] !== 'undefined') return true
    }
    return false
  }

  if (schema.type) return schema.type
  let possibleTypes = []
  if (has(['properties','additionalProperties','patternProperties','minProperties','maxProperties','required','dependencies'])) {
    possibleTypes.push('object')
  }
  if (has(['items','additionalItems','maxItems','minItems','uniqueItems'])) {
    possibleTypes.push('array')
  }
  if (has(['exclusiveMaximum','exclusiveMinimum','maximum','minimum','multipleOf'])) {
    possibleTypes.push('number')
  }
  if (has(['maxLength','minLength','pattern'])) {
    possibleTypes.push('number')
  }
  if (schema.enum) {
    for (let value of schema.enum) {
      possibleTypes.push(typeof value); // doesn't matter about dupes
    }
  }

  if (possibleTypes.length === 1) return possibleTypes[0]
  return 'any'
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
  } else {
    data['x-customRequestExamples'] = [{ object: {} }]
  }

  return data
}

function urlEncode (obj) {
  return querystring.stringify(obj)
}

module.exports = {
  preProcess,
  computeApiHost,
  isAGatewayApi,
  pushValueMinItemsMaxItems,
  pushValueLength,
  pushValuePattern,
  pushValueMultipleOf,
  pushValueMinimumMaximum,
  pushValueEnum,
  getValueDefault,
  getValueExamples,
  pushValueConst,
}
