const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse')
const helperFunctions = require('./helper_functions')

const ERROR_START = '\u001b[31m'
const ERROR_END = '\u001b[0m'

async function runInCli () {
  const options = helperFunctions.parseArgs()

  if (!options.api || !options.descriptions || !options.output) {
    console.log('Please specify --api, --descriptions, and --output.')
    process.exit(1)
  }

  let api = helperFunctions.parseYaml(options.api)
  const descriptions = await parseCsv(options.descriptions)
  api = await insertDescriptions(api, descriptions, options.api)
  const s = helperFunctions.dumpYaml(api)
  fs.writeFileSync(options.output, s)
}

async function runInNode (api, descriptionsFile, outputFileStem) {
  const descriptions = await parseCsv(descriptionsFile)
  const apiName = outputFileStem + ' v' + api.info.version
  api = await insertDescriptions(api, descriptions, apiName)

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
      // Temporary fix for some description keys
      if (k === 'FiltersApiAccessRule_Descriptions') descriptions['FiltersApiAccessRulessRule_Descriptions'] = v
      if (k === 'FiltersDedicatedGroup_CpuGenerations') descriptions['FiltersDedicatedGroupRequest_CpuGenerations'] = v
      if (k === 'FiltersDedicatedGroup_DedicatedGroupIds') descriptions['FiltersDedicatedGroupRequest_DedicatedGroupIds'] = v
      if (k === 'FiltersDedicatedGroup_Names') descriptions['FiltersDedicatedGroupRequest_Names'] = v
      if (k === 'FiltersDedicatedGroup_SubregionNames') descriptions['FiltersDedicatedGroupRequest_SubregionNames'] = v
      if (k === 'FiltersKeypair_KeypairTypes') descriptions['FiltersKeypair_KeypairType'] = v
      if (k === 'CreateLoadBalancerTagsRequest_LoadBalancerNames') descriptions['CreateLoadBalancerTagsRequest_LoadBalancerNames,'] = v
      if (k === 'DeleteLoadBalancerTagsRequest_LoadBalancerNames') descriptions['DeleteLoadBalancerTagsRequest_LoadBalancerNames,'] = v
    }
    // Temporary fix for some description key
    descriptions['ReadCatalogsRequest'] = ' '
    descriptions['ReadCatalogsResponse'] = ' '

    return descriptions
  } catch (err) {
    console.error(ERROR_START + 'CSV ' + err.toString() + ERROR_END)
    process.exit(1)
  }
}

function insertDescriptions (obj, descriptions, apiName) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'object') {
      insertDescriptions(v, descriptions, apiName)
    } else if (k === 'description') {
      obj[k] = descriptions[v] || '**NOT_FOUND description: ' + v + '**'
      if (obj[k] == '**NOT_FOUND description: ' + v + '**') {
        console.error(`${ERROR_START}NOT_FOUND description (${apiName}):${ERROR_END} ${v}`)
      }
    }
  }

  return obj
}

if (path.parse(process.argv[1]).base === path.parse(__filename).base) {
  runInCli()
}

module.exports = runInNode
