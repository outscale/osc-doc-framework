const jptr = require('reftools/lib/jptr.js').jptr
const walkSchema = require('oas-schema-walker').walkSchema
const wsGetState = require('oas-schema-walker').getDefaultState
const generateCurlExamples = require('./code_shell')
const generateHclExamples = require('./code_hcl')
const generateJavaScriptExamples = require('./code_javascript')
const generateOapiCliExamples = require('./code_oapi-cli')
const generateOscCliExamples = require('./code_console')
const generatePythonExamples = require('./code_python')
const xml = require('jgexml/json2xml.js')

const DEFAULT_BASE_URL = '/'

function preProcess (data) {
  data = _concatenateOneOfsAndAnyOfs(data)
  data.api.servers = _getServers(data)
  if (data.baseUrl === '//') {data.baseUrl = DEFAULT_BASE_URL}
  data.host = computeApiHost(data)
  data.resources = _sortTags(data)
  data.version = _getVersion(data)

  data.custom = {
    createTabs,
    evaluateResponses,
    fakeBodyParameter,
    generateAuthenticationSchemesSection,
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
    isAGatewayApi,
    printDescription,
    printErrorResponses,
    printOperationName,
    printParameterName,
    printRequired,
    printType,
    schemaToArray,
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
    content += '|Base URLs|\n'
    content += '|---|\n'
  }
  for (const server of servers) {
    if (server.description) {
      content += '|' + server.description + '|\n'
    }
    const entries = Object.entries(server.variables || {})
    const [k, v] = entries[0] || ['', {}]
    for (e of v .enum || [v.default]) {
      content += '|'
      if (server.url === DEFAULT_BASE_URL) {
        content += DEFAULT_BASE_URL
      } else {
        const server_text = server.url.replace('{' + k + '}', '`' + e + '`')
        const server_url = server.url.replace('{' + k + '}', e)
        content += '[' + server_text + '](' + server_url + ')'
      }
      content += '|\n'
    }
  }

  return content
}

function computeApiHost (data) {
  let host = ''
  if (data.servers) {
    const serverUrl = data.servers[0]?.url
    if (serverUrl && serverUrl !== '//') {
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

// Modified from Widdershins
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
  const security = data.api.security
  const securitySchemes = data.api.components.securitySchemes
  if (security.length > 1) {
    s = 'There are ' + security.length + ' possible ways to authenticate your requests with'
    if (data.api.info?.title) {
      s += ' the ' + data.api.info?.title + ':\n\n'
    } else {
      s == ' this API:\n\n'
    }
  }
  for (const sec of security) {
    const heading = _formatAuthenticationRequirement(sec, data.host)
    s += '### ' + heading + '\n\n'
    s += '|HTTP Header|Description|\n'
    s += '|---|---|\n'
    for (const key of Object.keys(sec)) {
      const item = securitySchemes[key]
      if (item.scheme === 'basic') {
        s += '|`Authorization`|' + item.description + '|\n'
      } else {
        s += '|`' + item.name + '`|' + item.description + '|\n'
      }
    }
    s += '\n\n'
  }

  return s
}

function _formatAuthenticationRequirement (array, host) {
  let name = Object.keys(array).join('/')
  if (isAGatewayApi(host)) {
    if (name === 'ApiKeyAuth' || name === 'ApiKeyAuthSec') {
      name = 'access key/secret key'
    } else if (name === 'BasicAuth') {
      name = 'login/password'
    }  
  } else {
    name = name.replace(/\B([A-Z][a-z])/g, " $1")
    name = name.replace(/Basic Auth/g, 'Basic Authentication').replace(/ Auth\b/g, '')
    name = name.replace(/\/OTP Code/g, '')
  }

  return name
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
  const list = []
  const security = data.operation.security || data.security
  for (const sec of security) {
    let name = _formatAuthenticationRequirement(sec, data.host)
    name = name.replace(/([A-Z][a-z])/g, (x) => x.toLowerCase())
    list.push('<a href="#authentication-schemes">' + name + '</a>')
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

function printDescription (p, host) {
  let s = p.description || ''

  // Expand the description by reading the other OpenAPI keywords of the schema
  let array = []
  if (isAGatewayApi(host) && !host.startsWith('okms') && !host.startsWith('kms')) {
    array = getValuePattern(array, p.schema)
  } else {
    array = getValueLength(array, p.schema)
    array = getValuePattern(array, p.schema)
    array = getValueMinimumMaximum(array, p.schema)
    array = getValueEnum(array, p.schema)
    array = getValueDefault(array, p.schema)
  }
  if (array.length) {
    if (p.description) {s += '<br />'}
    s += array.join('. ') + '.'
  }

  if (s) {
    s = s.replace(/\n/g, '')
    s = s.replace(/\|/g, '\\|')
  }

  return s
}

function getValueLength (array, schema) {
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

function getValuePattern (array, schema) {
  let pattern = schema.items?.pattern || schema.pattern

  if (pattern !== undefined) {
    array.push('Pattern: `' + pattern + '`')
  }

  return array
}

function getValueMinimumMaximum (array, schema) {
  let minimum = schema.items?.minimum || schema.minimum
  let maximum = schema.items?.maximum || schema.maximum

  if (minimum !== undefined) {
    let parenthesis = ' (included)'
    if (schema.items?.exclusiveMinimum || schema.exclusiveMinimum) {
      parenthesis = ' (excluded)'
    }
    array.push('Minimum: `' + minimum + '`' + parenthesis)
  }

  if (maximum !== undefined) {
    let parenthesis = ' (included)'
    if (schema.items?.exclusiveMaximum || schema.exclusiveMaximum) {
      parenthesis = ' (excluded)'
    }
    array.push('Maximum: `' + maximum + '`' + parenthesis)
  }

  return array
}

function getValueEnum (array, schema) {
  let enums = schema.items?.enum || schema.enum

  if (enums !== undefined) {
    array.push('Possible values: `' + enums.join('` | `') + '`')
  }

  return array
}

function getValueDefault (array, schema) {
  let v = schema.items?.default || schema.default

  if (v !== undefined) {
    // https://stackoverflow.com/a/57467694
    v = JSON.stringify(v, null, 1) // stringify, with line-breaks and indents
    v = v.replace(/^ +/gm, ' ') // remove all but the first space for each line
    v = v.replace(/\n/g, '') // remove line-breaks
    v = v.replace(/{ /g, '{').replace(/ }/g, '}') // remove spaces between object-braces and first/last props
    v = v.replace(/\[ /g, '[').replace(/ \]/g, ']') // remove spaces between array-brackets and first/last items

    v = v.replace(/^"/, '').replace(/"$/, '') // remove quotes if it's a single string

    if (v === 'true' || v === 'false') {
      array.push('Default: ' + v)
    } else if (v) {
      array.push('Default: `' + v + '`')
    } else {
      array.push('Default: <code></code>')
    }
  }

  return array
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
    if (schema.title) block.title = schema.title
    if (!block.title && schema.description)
      block.title = schema.description
    block.description = schema.description
    if (schema.externalDocs)
      block.externalDocs = schema.externalDocs
  }
  container.push(block)
  let wsState = wsGetState()
  wsState.combine = true
  wsState.allowRefSiblings = true
  walkSchema(schema,{},wsState,function(schema,parent,state){

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
      if (isBlock) entry.name = '*'+data.translations.anonymous+'*'
      else entry.name = state.property.split('/')[1]
    }
    else if (!state.top) console.warn(state.property)
    if (!entry.name && schema.title) {
      entry.name = '*item*'
      if (schema.type === 'array') entry.name = '*array*'
    }

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
  }

  return data
}

module.exports = {
  preProcess,
  computeApiHost,
  isAGatewayApi,
  getValueLength,
  getValuePattern,
  getValueMinimumMaximum,
  getValueEnum,
  getValueDefault,
}
