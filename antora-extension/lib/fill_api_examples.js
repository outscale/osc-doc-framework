const fs = require('fs')
const path = require('path')
const openapiExamplesValidator = require('openapi-examples-validator')
const helperFunctions = require('./helper_functions')

const ERROR_START = '\u001b[31m'
const ERROR_END = '\u001b[0m'

async function runInCli () {
  const options = helperFunctions.parseArgs()

  if (!options.api || !options.examples || !options.output) {
    console.log('Please specify --api, --examples, and --output.')
    process.exit(1)
  }

  let api = helperFunctions.parseYaml(options.api)
  const apiFilename = path.parse(options.api).base 
  const examples = helperFunctions.parseYaml(options.examples)
  api = insertExamples(api, examples, apiFilename)
  await runOpenapiExamplesValidator(api)
  const s = helperFunctions.dumpYaml(api)
  fs.writeFileSync(options.output, s)
}

async function runInNode (api, examplesFile, apiFilepath) {
  const examples = helperFunctions.parseYaml(examplesFile)
  const apiFilename = path.parse(apiFilepath).base + ' v' + api.info.version
  api = await insertExamples(api, examples, apiFilename)
  await runOpenapiExamplesValidator(api)

  return api
}

function insertExamples (api, examples, apiFilename) {
  const paths = api.paths
  for (const path of Object.values(paths)) {
    const op = path.post || path.get
    const operationId = op.operationId
    const reqExamples = examples[operationId]?.request
    const respExamples = examples[operationId]?.response

    op.requestBody.content['application/json'].examples = reqExamples
    op.responses['200'].content['application/json'].examples = respExamples

    if (!reqExamples || !respExamples) {
      let msg = `${ERROR_START}NOT_FOUND example (${apiFilename}):${ERROR_END} ${operationId}`
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
  if (process.env.OPENAPI_EXAMPLES_VALIDATOR === "true" && result.errors.length > 0) {
    process.exit(1)
  }
}

if (path.parse(process.argv[1]).base === path.parse(__filename).base) {
  runInCli()
}

module.exports = runInNode
