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
    !args['--antora-component-repo'] ||
    !args['--antora-component-lang'] ||
    !args['--output']
  ) {
    console.log(
      'Please specify --api, [--descriptions], [--examples], [--errors], [--languages], ' +
        '--antora-component-repo, --antora-component-lang, [--no-osc-cli-partials], and --output.'
    )
    process.exit(1)
  }

  const apiFile = args['--api']
  const descriptionsFile = args['--descriptions']
  const examplesFile = args['--examples']
  const errorsFile = args['--errors']
  const languages = args['--languages']
  const componentRepo = args['--antora-component-repo']
  const componentLanguage = args['--antora-component-lang']
  const noOscCliPartials = args['--no-osc-cli-partials']
  const outputFolder = args['--output']

  createWorkFolder(outputFolder, componentRepo, componentLanguage)

  let api = helperFunctions.parseYaml(apiFile)

  if (descriptionsFile) {
    api = await fillApiDescriptions(api, descriptionsFile, componentRepo)
  }

  if (examplesFile) {
    api = await fillApiExamples(api, examplesFile, componentRepo)
  }

  const apiMarkdown = await runWiddershins(api, languages)
  runShins(apiMarkdown, `${outputFolder}/${componentRepo}/antora-component/modules/ROOT/partials/${componentRepo}.html`)

  if (errorsFile) {
    const errors = helperFunctions.parseYaml(errorsFile)
    const errorsMarkdown = generateErrorMarkdown(errors, api)
    runShins(
      errorsMarkdown,
      `${outputFolder}/${componentRepo}/antora-component/modules/ROOT/partials/${componentRepo}-errors.html`,
    )
  }

  if (!noOscCliPartials) {
    generateOscCliPartials(apiMarkdown, api, `${outputFolder}/${componentRepo}/antora-component/modules/ROOT/partials`)
  }
}

function createWorkFolder (outputFolder, componentRepo, componentLanguage) {
  fs.rmSync(outputFolder, { recursive: true, force: true })
  fs.cpSync(
    `${componentRepo}/antora-component`,
    `${outputFolder}/${componentRepo}/antora-component`,
    { recursive: true },
  )
  let componentTemplate = fs.readFileSync(`${componentLanguage}/antora.yml`, 'utf-8')
  componentTemplate = componentTemplate.replace(/name: .+?\n/, `name: ROOT\n`)
  fs.writeFileSync(`${outputFolder}/${componentRepo}/antora-component/antora.yml`, componentTemplate)
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
  if (languages.trim() !== '\\') {
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
