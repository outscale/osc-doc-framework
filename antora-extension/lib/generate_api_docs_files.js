const fs = require('fs')
const shins = require('shins')
const widdershins = require('widdershins')
const helperFunctions = require('./helper_functions')
const fillApiDescriptions = require('./fill_api_descriptions')
const fillApiExamples = require('./fill_api_examples')
const generateErrorMarkdown = require('./generate_error_markdown')
const generateOscCliPartials = require('./generate_osc_cli_partials')
const CONSOLE_LOG = console.log

async function main () {
  const args = helperFunctions.parseArgs()

  if (
    !args['--api'] ||
    !args['--antora-component-path'] ||
    !args['--antora-component-lang'] ||
    !args['--output']
  ) {
    console.log(
      'Please specify --api, [--descriptions], [--examples], [--errors], [--languages], ' +
        '--antora-component-path, --antora-component-lang, and --output.'
    )
    process.exit(1)
  }

  const apiFile = args['--api']
  const descriptionsFile = args['--descriptions']
  const examplesFile = args['--examples']
  const errorsFile = args['--errors']
  const languages = args['--languages']
  const componentPath = args['--antora-component-path']
  const componentLanguage = args['--antora-component-lang']
  const outputFolder = args['--output']

  createWorkFolder(outputFolder, componentPath, componentLanguage)

  let api = helperFunctions.parseYaml(apiFile)

  if (descriptionsFile) {
    api = await fillApiDescriptions(api, descriptionsFile)
  }

  if (examplesFile) {
    api = await fillApiExamples(api, examplesFile)
  }

  const apiMarkdown = await runWiddershins(api, languages)
  runShins(apiMarkdown, `${outputFolder}/${componentPath}/modules/ROOT/partials/index.html`)

  if (errorsFile) {
    const errors = helperFunctions.parseYaml(errorsFile)
    const errorsMarkdown = generateErrorMarkdown(errors, api)
    runShins(errorsMarkdown, `${outputFolder}/${componentPath}/modules/ROOT/partials/errors.html`)
  }

  generateOscCliPartials(apiMarkdown, api, `${outputFolder}/${componentPath}/modules/ROOT/partials`)
}

function createWorkFolder (outputFolder, componentPath, componentLanguage) {
  fs.rmSync(outputFolder, { recursive: true, force: true })
  fs.cpSync(componentPath, `${outputFolder}/${componentPath}`, { recursive: true })
  let componentTemplate = fs.readFileSync(`${componentLanguage}/antora.yml`, 'utf-8')
  componentTemplate = componentTemplate.replace(/name: .+?\n/, `name: ROOT\n`)
  fs.writeFileSync(`${outputFolder}/${componentPath}/antora.yml`, componentTemplate)
}

function runWiddershins (api, languages) {
  console.log = turnOffConsoleLog()
  const languageTabs = getLanguageTabs(languages)

  // https://github.com/Mermade/widdershins/blob/main/README.md#options
  const widdershinsOptions = {
    expandBody: true,
    omitBody: true,
    codeSamples: languageTabs.length > 0,
    language_tabs: languageTabs,
    user_templates: __dirname + '/../data/widdershins-templates',
    sample: true,
  }
  const apiMarkdown = widdershins.convert(api, widdershinsOptions)
  console.log = turnOnConsoleLog()

  return apiMarkdown
}

function getLanguageTabs (languages) {
  const tabs = []
  if (languages) {
    const map = {
      console: 'OSC CLI',
      csharp: 'C#',
      go: 'Go',
      http: 'HTTP',
      java: 'Java',
      javascript: 'JavaScript',
      nodejs: 'Node.js',
      php: 'PHP',
      python: 'Python',
      ruby: 'Ruby',
      shell: 'Shell',
    }
    languages = languages.split(',')
    for (let i = 0; i < languages.length; i++) {
      const key = languages[i].trim()
      tabs.push({ [key]: map[key] })
    }
  }

  return tabs
}

function runShins (markdown, outputFile) {
  console.log = turnOffConsoleLog()

  // https://github.com/Mermade/shins/blob/master/README.md#api
  const shinsOptions = {
    customCss: true,
    root: __dirname + '/../data/shins-templates',
    layout: 'layout.ejs',
  }
  shins.render(markdown, shinsOptions, function (err, html) {
    if (err) {
      console.error(err)
    } else {
      fs.mkdirSync(outputFile.split('/').slice(0, -1).join('/'), { recursive: true })
      fs.writeFileSync(outputFile, html)
    }
  })
  console.log = turnOnConsoleLog()
}

function turnOffConsoleLog () {
  return function () {}
}

function turnOnConsoleLog () {
  return CONSOLE_LOG
}

main()
