const fs = require('fs')
const csvParse = require('csv-parse')
const helperFunctions = require('./helper_functions')

const ERROR_START = '\u001b[31m'
const ERROR_END = '\u001b[0m'

async function runInCli () {
  const args = helperFunctions.parseArgs()

  if (!args['--api'] || !args['--descriptions'] || !args['--output']) {
    console.log('Please specify --api, --descriptions, and --output.')
    process.exit(1)
  }

  let api = helperFunctions.parseYaml(args['--api'])
  const descriptions = await parseCsv(args['--descriptions'])
  api = await insertDescriptions(api, descriptions)
  const s = helperFunctions.dumpYaml(api)
  fs.writeFileSync(args['--output'], s)
}

async function runInNode (api, descriptionsFile) {
  const descriptions = await parseCsv(descriptionsFile)
  api = await insertDescriptions(api, descriptions)

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

function insertDescriptions (obj, descriptions) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'object') {
      insertDescriptions(v, descriptions)
    } else if (k === 'description') {
      obj[k] = descriptions[v] || 'NOT_FOUND'
      if (obj[k] == 'NOT_FOUND') {
        console.error(ERROR_START + 'NOT_FOUND description: ' + ERROR_END + v)
      }
    }
  }

  return obj
}

if (process.argv[1] === __filename) {
  runInCli()
}

module.exports = runInNode
