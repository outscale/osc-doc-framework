const fs = require('fs')
const openapiExamplesValidator = require('openapi-examples-validator')
const helperFunctions = require('./helper_functions')

const ERROR_START = '\u001b[31m'
const ERROR_END = '\u001b[0m'

async function runInCli () {
  const args = helperFunctions.parseArgs()

  if (!args['--api'] || !args['--examples'] || !args['--output']) {
    console.log('Please specify --api, --examples, and --output.')
    process.exit(1)
  }

  let api = helperFunctions.parseYaml(args['--api'])
  const examples = helperFunctions.parseYaml(args['--examples'])
  api = insertExamples(api, examples)
  if (process.env.OPENAPI_EXAMPLES_VALIDATOR === "true") {
    await runOpenapiExamplesValidator(api)
  }
  const s = helperFunctions.dumpYaml(api)
  fs.writeFileSync(args['--output'], s)
}

async function runInNode (api, examplesFile, outputFileStem) {
  const examples = helperFunctions.parseYaml(examplesFile)
  const apiName = outputFileStem + ' v' + api.info.version
  api = await insertExamples(api, examples, apiName)
  if (process.env.OPENAPI_EXAMPLES_VALIDATOR === "true") {
    await runOpenapiExamplesValidator(api)
  }

  return api
}

function insertExamples (api, examples, apiName) {
  const paths = api.paths
  for (const path of Object.values(paths)) {
    const op = path.post || path.get
    const operationId = op.operationId
    const reqExamples = examples[operationId]?.request
    const respExamples = examples[operationId]?.response

    op.requestBody.content['application/json'].examples = reqExamples
    op.responses['200'].content['application/json'].examples = respExamples

    if (!reqExamples || !respExamples) {
      let msg = `${ERROR_START}NOT_FOUND example (${apiName}):${ERROR_END} ${operationId}`
      if (!reqExamples) {
        msg += ' (request)'
      }
      if (!respExamples) {
        msg += ' (response)'
      }
      console.error(msg)
    }
  }

  return api
}

async function runOpenapiExamplesValidator (api) {
  const s = helperFunctions.dumpYaml(api)
  const api2 = helperFunctions.parseYaml(s)

  const result = await openapiExamplesValidator.default(api2)
  for (const e of result.errors) {
    let msg = ERROR_START + 'Error in example:\n' + ERROR_END
    msg += '  ' + e.examplePath + e.instancePath + '\n'
    msg = msg.replace(/\/paths\/(~1)?(.+?)\/.+?\/(request|response)s?.+?\/examples/, '$2 > $3').replaceAll('/', ' > ')
    msg += '  ' + e.message
    if (e.params.additionalProperty) msg += " ('" + e.params.additionalProperty + "')"
    console.error(msg)
  }
  if (result.errors.length > 0) {
    process.exit(1)
  }
}

if (process.argv[1] === __filename) {
  runInCli()
}

module.exports = runInNode
