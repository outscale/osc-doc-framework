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
  const apiFilename = path.parse(options.api).base
  const descriptions = await parseCsv(options.descriptions)
  api = await insertDescriptions(api, descriptions, apiFilename)
  const s = helperFunctions.dumpYaml(api)
  fs.writeFileSync(options.output, s)
}

async function runInNode (api, descriptionsFile, apiFilepath) {
  const descriptions = await parseCsv(descriptionsFile)
  const apiFilename = path.parse(apiFilepath).base + ' v' + api.info.version
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
