const fs = require('fs')
const path = require('path')
const helperFunctions = require('./helper_functions')
const widdershinsPreProcess = require('../data/widdershins-templates/_pre_process')

const VERBS = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace']
let SEP = '_'
let CSV_ARRAY = []

async function runInCli () {
  const options = helperFunctions.parseArgs()

  if (!options.api || !options.outputYaml || !options.outputCsv) {
    console.log('Please specify --api, [--no-sort-keys], [--separator], --output-yaml, and --output-csv.')
    process.exit(1)
  }
  SEP = options.separator || SEP

  let api = helperFunctions.parseYaml(options.api)
  api = await setDescriptionFields(api)

  const yaml_string = helperFunctions.dumpYaml(api, options.noSortKeys)
  fs.writeFileSync(options.outputYaml, yaml_string)

  const csv_string = 'Key;English\n' + CSV_ARRAY.sort().join('\n') + '\n'
  fs.writeFileSync(options.outputCsv, csv_string)
}

async function runInNode (api) {
  api = setDescriptionFields(api)

  return api
}

function setDescriptionFields (api) {
  let isItAGatewayApi
  const host = widdershinsPreProcess.computeApiHost(api)
  if (host) {
    isItAGatewayApi = widdershinsPreProcess.isAGatewayApi(host)
  } else {
    isItAGatewayApi = api.info?.title?.startsWith('AWS')
  }

  if (api.info) {
    // delete api.info.summary
    CSV_ARRAY.push(writeCsv(SEP + 'info', api.info.description))
    delete api.info.description
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
    processObj('', v, isItAGatewayApi, k)
    for (const verb of VERBS) {
      if (v[verb]) {
        const operation = v[verb].operationId || k.slice(1)
        processObj(SEP + operation, v[verb], isItAGatewayApi, k)
      }
    }
  }
}

function processObj (k, obj, isItAGatewayApi, parentK = null) {
  if (obj.$ref) {
    // delete obj.summary
    delete obj.description
  } else {
    if (k && !k.endsWith(SEP + 'items')) {
      if (isItAGatewayApi) {
        tweakObjDescriptionForGateway(k, obj)
      }
      // delete obj.summary
      if (obj.description) {
        if (k.includes(SEP + 'responses' + SEP)) {
          k = SEP + 'responses' + SEP + parentK
          obj.description = k
          const s = writeCsv(k, obj.description)
          if (!CSV_ARRAY.includes(s)) {
            CSV_ARRAY.push(s)
          }
        } else {
          CSV_ARRAY.push(writeCsv(k, obj.description))
          delete obj.description
          delete obj.items?.description
        }
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
      CSV_ARRAY.push(writeCsv(prefix + SEP + parameter.name, parameter.description))
      delete parameter.description
      // processObj(prefix + SEP + parameter.name, parameter.schema || {}, isItAGatewayApi)
    }

    const properties = Object.entries(obj.properties || {})
    for (const [k2, property] of properties) {
      processObj(k + SEP + k2, property || {}, isItAGatewayApi)
      processObj(k + SEP + k2 + SEP + 'items', property.items || {}, isItAGatewayApi)
    }
    const responses = Object.entries(obj.responses || {})
    for (const [k2, response] of responses) {
      processObj(obj.operationId + SEP + 'responses' + SEP + k2, response || {}, isItAGatewayApi, k2)
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
    delete obj.description
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

function writeCsv (key, value) {
  let s = ''
  if (value) {
    value = value.replaceAll('"', '&quot;')
    if (value.includes(';') || value.includes('\n')) {
      value = '"' + value.trimEnd() + '"'
    }
    s = key + ';' + value
  }

  return s
}

if (path.parse(process.argv[1]).base === path.parse(__filename).base) {
  runInCli()
}

module.exports = runInNode
