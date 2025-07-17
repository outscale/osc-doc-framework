const fs = require('fs')
const yaml = require('js-yaml')
const cloneRepository = require('./clone_repository')
const downloadPackage = require('./download_package')
const generateApiDocsFiles = require('./generate_api_docs_files')

const TEMP_DIR = 'build/.tmp'

async function main () {
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  const obj = JSON.parse(process.env.APIDOC)
  const options = {
    api: obj.buildOptions.apiFile,
    mergeAllofs: obj.buildOptions.mergeAllofs,
    descriptions: obj.buildOptions.descriptionsFile,
    resetDescriptionKeys: obj.buildOptions.resetDescriptionKeys,
    showSummaryKeys: obj.buildOptions.showSummaryKeys,
    noSortKeys: obj.buildOptions.noSortKeys,
    separator: obj.buildOptions.separator,
    examples: obj.buildOptions.examplesFile,
    errors: obj.buildOptions.errorsFile,
    languages: obj.buildOptions.languages,
    oscCliPartials: obj.buildOptions.generateOscCliPartials,
    oapiCliPartials: obj.buildOptions.generateOapiCliPartials,
    outputYamlPath: obj.buildOptions.outputYamlPath,
    outputFileStem: obj.buildOptions.outputPageName,
    outputDir: TEMP_DIR,
  }

  if (fs.existsSync(TEMP_DIR + '/antora.yml') === false) {
    const s = fs.readFileSync('en/antora.yml', 'utf-8')
    const descriptor = yaml.load(s)
    descriptor.name = 'ROOT'
    delete descriptor.nav
    fs.writeFileSync(TEMP_DIR + '/antora.yml', yaml.dump(descriptor))
  }

  const api_repository = obj.apiRepository
  if (api_repository) {
    await cloneRepository(api_repository.url, api_repository.ref, options.outputDir, obj.source)
  }

  const api_package = obj.apiPackage
  if (api_package) {
    await downloadPackage(api_package.url, api_package.version, options.outputDir, obj.source, options.api, options.errors)
  }

  await generateApiDocsFiles(options)
}

main()
