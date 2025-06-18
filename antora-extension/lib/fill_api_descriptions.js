const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse')
const helperFunctions = require('./helper_functions')
const widdershinsPreProcess = require('../data/widdershins-templates/_pre_process')

const VERBS = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace']
const ERROR_START = '\u001b[31m'
const ERROR_END = '\u001b[0m'
let SEP = '_'

async function runInCli () {
  const options = helperFunctions.parseArgs()

  if (!options.api || !options.descriptions || !options.output) {
    console.log(
      'Please specify --api, --descriptions, [--reset-description-keys], [--no-sort-keys], [--separator], and --output.'
    )
    process.exit(1)
  }

  let api = helperFunctions.parseYaml(options.api)
  const apiFilename = path.parse(options.api).base
  const descriptions = await parseCsv(options.descriptions)
  if (options.resetDescriptionKeys) {
    SEP = options.separator || SEP
    api = await setDescriptionFields(api)
  }
  api = await insertDescriptions(api, descriptions, apiFilename)
  const s = helperFunctions.dumpYaml(api, options.noSortKeys)
  fs.writeFileSync(options.output, s)
}

async function runInNode (api, descriptionsFile, apiFilepath, resetDescriptionKeys, separator) {
  const descriptions = await parseCsv(descriptionsFile)
  const apiFilename = path.parse(apiFilepath).base + ' v' + api.info.version
  if (resetDescriptionKeys) {
    SEP = separator || SEP
    api = setDescriptionFields(api)
  }
  api = await insertDescriptions(api, descriptions, apiFilename)

  return api
}

async function parseCsv (filepath) {
  try {
    const stream = fs.createReadStream(filepath)

    // https://csv.js.org/parse/options/
    const csvOptions = {
      delimiter: ';',
      from_line: 2,
      trim: true,
    }
    const csv = stream.pipe(csvParse.parse(csvOptions))

    const descriptions = {}
    for await (const [k, v] of csv) {
      descriptions[k] = v
    }

    return descriptions
  } catch (err) {
    console.error(ERROR_START + 'CSV ' + err.toString() + ERROR_END)
    process.exit(1)
  }
}

function setDescriptionFields (api) {
  let isItAGatewayApi
  const host = widdershinsPreProcess.computeApiHost(api)
  if (host) {
    isItAGatewayApi = widdershinsPreProcess.isAGatewayApi(host)
  } else {
    isItAGatewayApi = api.info?.title?.startsWith('AWS')
  }
  // For the purpose of this script, OKS is treated like Gateway APIs
  if (api.info?.title === 'OKS API') {
    isItAGatewayApi = true
  }

  if (api.info) {
    // delete api.info.summary
    delete api.info.description
    api.info = placeDescriptionFieldInObj(SEP + 'info', api.info)
  }

  if (api.servers) {
    processServers(api.servers)
  }

  const pathItemsGroups = [api.paths, api.webhooks, api.components?.pathItems]
  for (const pathItems of pathItemsGroups) {
    if (pathItems) {
      processPathItems(pathItems, isItAGatewayApi)
    }
  }

  const fields = ['schemas', 'responses', 'parameters', 'examples', 'requestBodies', 'headers', 'securitySchemes', 'links', 'callbacks']
  const components = api.components || {}
  for (const field of fields) {
    const obj = Object.entries(components[field] || {})
    for (const [k, v] of obj) {
      if (field === 'responses') {
        v.description = k
        processObj(k, v, false)
      } else {
        processObj(k, v, isItAGatewayApi)
      }
    }
  }

  const tags = api.tags || []
  for (const n of tags) {
    processObj(SEP + 'tags' + SEP + n.name, n, isItAGatewayApi)
  }

  if (api.externalDocs) {
    api.externalDocs.description = SEP + 'externalDocs'
  }

  return api
}

function processServers (servers) {
  for (const server of servers) {
    delete server.description
    const variables = Object.values(server.variables || {})
    for (const variable of variables) {
      delete variable.description
    }
  }
}

function processPathItems (pathItems, isItAGatewayApi) {
  for (const [k, v] of Object.entries(pathItems)) {
    processObj('', v, isItAGatewayApi)
    for (const verb of VERBS) {
      if (v[verb]) {
        const operation = v[verb].operationId || k.slice(1)
        processObj(SEP + operation, v[verb], isItAGatewayApi)
      }
    }
  }
}

function processObj (k, obj, isItAGatewayApi) {
  if (obj.$ref) {
    // delete obj.summary
    delete obj.description
  } else {
    if (k && !k.endsWith(SEP + 'items')) {
      // delete obj.summary
      delete obj.description
      delete obj.items?.description
      obj = placeDescriptionFieldInObj(k, obj)
      if (isItAGatewayApi) {
        tweakObjDescriptionForGateway(k, obj)
      }
    } else if (!k) {
      // delete obj.summary
      delete obj.description
    }
    if (obj.externalDocs) {
      obj.externalDocs.description = k + SEP + 'externalDocs'
    }
    if (obj.requestBody) {
      delete obj.requestBody.description
    }
    if (obj.additionalProperties) {
      delete obj.additionalProperties.description
    }

    const mediaTypes = Object.values(obj.content || {})
    for (const mediaType of mediaTypes) {
      if (mediaType.schema) {
        delete mediaType.schema.description
        processObj(k, mediaType.schema, isItAGatewayApi)
      }
    }
    if (obj.schema) {
      delete obj.description
      processObj(k, obj.schema, isItAGatewayApi)
    }

    const xOfs = ['allOf', 'anyOf', 'oneOf']
    for (const xOf of xOfs) {
      for (const [i, n] of Object.entries(obj[xOf] || [])) {
        if (n.description || n.externalDocs || n.requestBody || n.parameters || n.properties || n.responses || n.headers || n.servers) {
          processObj(k + SEP + i, n || {}, isItAGatewayApi)
        }
        if (n.additionalProperties) {
          delete n.additionalProperties.description
        }
      }
    }

    const parameters = obj.parameters || []
    let prefix = obj.operationId || ''
    if (isItAGatewayApi) {
      prefix = tweakPrefixForGateway(k, prefix)
    }
    for (const parameter of parameters) {
      parameter.description = prefix + SEP + parameter.name
      // processObj(prefix + SEP + parameter.name, parameter.schema || {}, isItAGatewayApi)
    }

    const properties = Object.entries(obj.properties || {})
    for (const [k2, property] of properties) {
      processObj(k + SEP + k2, property || {}, isItAGatewayApi)
      processObj(k + SEP + k2 + SEP + 'items', property.items || {}, isItAGatewayApi)
    }
    const responses = Object.entries(obj.responses || {})
    for (const [k2, response] of responses) {
      processObj(obj.operationId + SEP + 'responses' + SEP + k2, response || {}, isItAGatewayApi)
    }
    const headers = Object.entries(obj.headers || {})
    for (const [k2, header] of headers) {
      processObj(k + SEP + 'headers' + SEP + k2, header || {}, isItAGatewayApi)
    }

    processServers(obj.servers || [])
  }
}

function tweakObjDescriptionForGateway (k, obj) {
  // if (obj.description.startsWith(SEP + 'Get') && !k.startsWith('/Get')) {
  //   obj.description = obj.description.replace(SEP + 'Get', SEP)
  // } else if (obj.description.startsWith(SEP + 'Post') && !k.startsWith('/Post')) {
  //   obj.description = obj.description.replace(SEP + 'Post', SEP)
  // }
  if (k.endsWith(SEP + 'member') || k.endsWith('Request') || k.endsWith('Response')) {
    delete obj.description
  } else if (k.endsWith('DryRun') || k.endsWith('dryRun')) {
    obj.description = 'DryRun'
  } else if (k.includes(SEP + 'responses' + SEP)) {
    obj.description = SEP + 'responses' + SEP + k.split(SEP + 'responses' + SEP)[1]
  }
}

function tweakPrefixForGateway (k, prefix) {
  // if (prefix.startsWith('Get') && !k.startsWith('/Get')) {
  //   prefix = prefix.replace('Get', '')
  // } else if (prefix.startsWith('Post') && !k.startsWith('/Post')) {
  //   prefix = prefix.replace('Post', '')
  // }
  prefix += 'Request'

  return prefix
}

function placeDescriptionFieldInObj (descriptionPlaceholder, obj) {
  const entries = Object.entries(obj)
  const keys = Object.keys(obj)
  if (keys[0] === 'content' || !keys.includes('title')) {
    obj.description = descriptionPlaceholder
  }
  for (const [k, v] of entries) {
    delete obj[k]
    obj[k] = v
    if (k === 'title' || k === 'summary') {
      obj.description = descriptionPlaceholder
    }
  }
  if (!obj.description) {
    obj.description = descriptionPlaceholder
  }

  return obj
}

function insertDescriptions (obj, descriptions, apiFilename) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'object') {
      insertDescriptions(v, descriptions, apiFilename)
    } else if (k === 'description') {
      obj[k] = descriptions[v] || '**&lt;NOT_FOUND description: ' + v + '&gt;**'
      if (obj[k] == '**&lt;NOT_FOUND description: ' + v + '&gt;**') {
        console.error(`${ERROR_START}NOT_FOUND description (${apiFilename}):${ERROR_END} ${v}`)
      }
    }
  }

  return obj
}

if (path.parse(process.argv[1]).base === path.parse(__filename).base) {
  runInCli()
}

module.exports = runInNode
