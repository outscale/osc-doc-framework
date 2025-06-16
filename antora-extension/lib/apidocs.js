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
    descriptions: obj.buildOptions.descriptionsFile,
    resetDescriptionKeys: obj.buildOptions.resetDescriptionKeys,
    noSortKeys: obj.buildOptions.noSortKeys,
    separator: obj.buildOptions.separator,
    examples: obj.buildOptions.examplesFile,
    errors: obj.buildOptions.errorsFile,
    languages: obj.buildOptions.languages,
    oscCliPartials: obj.buildOptions.generateOscCliPartials,
    oapiCliPartials: obj.buildOptions.generateOapiCliPartials,
    outputFileStem: obj.buildOptions.outputPageName,
    repoName: obj.repoName,
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
    options.apiUrl = api_repository.url
    options.apiRef = api_repository.ref
    await cloneRepository(options)
  }

  const api_package = obj.apiPackage
  if (api_package) {
    options.apiProject = api_package.project
    options.apiVersion = api_package.version
    await downloadPackage(options)
  }

  await generateApiDocsFiles(options)
}

main()
