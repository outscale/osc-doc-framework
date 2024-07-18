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
    !args['--output-dir'] ||
    !args['--output-file-stem']
  ) {
    console.log(
      'Please specify --api, [--descriptions], [--examples], [--errors], [--languages], [--osc-cli-partials], ' +
        '--output-dir, and --output-file-stem.'
    )
    process.exit(1)
  }

  const apiFile = args['--api']
  const descriptionsFile = args['--descriptions']
  const examplesFile = args['--examples']
  const errorsFile = args['--errors']
  const languages = args['--languages']
  const oscCliPartials = args['--osc-cli-partials']
  const outputDir = args['--output-dir']
  const outputFileStem = args['--output-file-stem']

  let api = helperFunctions.parseYaml(apiFile)

  if (descriptionsFile) {
    api = await fillApiDescriptions(api, descriptionsFile, outputFileStem)
  }

  if (examplesFile) {
    api = await fillApiExamples(api, examplesFile, outputFileStem)
  }

  const apiMarkdown = await runWiddershins(api, languages)
  runShins(apiMarkdown, `${outputDir}/modules/ROOT/pages/${outputFileStem}.adoc`)

  if (errorsFile) {
    const errors = helperFunctions.parseYaml(errorsFile)
    const errorsMarkdown = generateErrorMarkdown(errors, api)
    runShins(errorsMarkdown, `${outputDir}/modules/ROOT/pages/${outputFileStem}-errors.adoc`)
  }

  if (oscCliPartials) {
    generateOscCliPartials(apiMarkdown, api, `${outputDir}/modules/ROOT/partials`)
  }
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
      html = postProcessDeprecationTags(html)
      html = postProcessAdmonitionsInTables(html)
      fs.mkdirSync(outputFile.split('/').slice(0, -1).join('/'), { recursive: true })
      fs.writeFileSync(outputFile, ':page-role: apidocs\n:noindex:\n\n++++\n' + html + '\n++++\n')
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

function postProcessDeprecationTags (html) {
  const headingsWithADeprecationTag = new RegExp('(<h2.*?>.+?)(<\/h2>)\n<p*?>(----Deprecation----)<\/p>', 'g')
  html = html.replace(headingsWithADeprecationTag, '$1$3$2')

  let idMatches = html.matchAll(/(?<=<h2 id=").+?(?=".+----Deprecation----)/g)
  for (const idMatch of idMatches) {
    const linksInLeftMenu = new RegExp('(<a href="#' + idMatch[0] + '".+?)(</a>)', 'g')
    html = html.replace(linksInLeftMenu, '$1----Deprecation----$2')
  }

  html = html.replace(/----Deprecation----/g, ' <span class="deprecation">Deprecation</span>')

  return html
}

function postProcessAdmonitionsInTables (html) {
  html = html.replace(
    /&gt; (\[.+?\])(<br \/>)+&gt; (.+?)(<br \/>)+/g,
    '<blockquote class="admonition-in-table"><p>$1<br />$3<br /></p></blockquote>',
  )

  return html
}

main()
