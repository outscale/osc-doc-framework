const fs = require('fs')
const path = require('path')
const shins = require('shins')
const widdershins = require('widdershins')
const allofMerge = require('allof-merge')
const helperFunctions = require('./helper_functions')
const fillApiDescriptions = require('./fill_api_descriptions')
const fillApiExamples = require('./fill_api_examples')
const generateErrorMarkdown = require('./generate_error_markdown')
const generateOscCliPartials = require('./generate_osc_cli_partials')
const generateOapiCliPartials = require('./generate_oapi_cli_partials')
const widdershinsPreProcess = require('../data/widdershins-templates/_pre_process')

const CONSOLE_LOG = console.log
const VERBS = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace']

async function runInCli () {
  const options = helperFunctions.parseArgs()
  generateApiDocsFiles(options)
}

async function runInNode (options) {
  generateApiDocsFiles(options)
}

async function generateApiDocsFiles (options) {
  if (!options.api || !options.outputFileStem) {
    console.log(
      'Please specify --api, [--merge-allofs], [--descriptions], [--reset-description-keys], ' +
      '[--show-summary-keys], [--no-sort-keys], [--separator], [--examples], [--errors], [--languages], ' +
      '[--widdershins-templates], [--shins-templates], [--osc-cli-partials], [--oapi-cli-partials], ' +
      '[--output-yaml-path], [--output-dir], and --output-file-stem.'
    )
    process.exit(1)
  }

  let apiFile = options.api
  const mergeAllofs = options.mergeAllofs
  const descriptionsFile = options.descriptions
  const resetDescriptionKeys = options.resetDescriptionKeys
  const showSummaryKeys = options.showSummaryKeys
  const noSortKeys = options.noSortKeys
  const separator = options.separator
  const examplesFile = options.examples
  let errorsFile = options.errors
  const languages = options.languages
  const widdershinsTemplates = options.templates || __dirname + '/../data/widdershins-templates'
  const shinsTemplates = options.templates || __dirname + '/../data/shins-templates'
  const oscCliPartials = options.oscCliPartials
  const oapiCliPartials = options.oapiCliPartials
  const outputYamlPath = options.outputYamlPath
  const outputDir = options.outputDir || 'build/.tmp'
  const outputFileStem = options.outputFileStem

  if (!fs.existsSync(apiFile)) {
    apiFile = apiFile.split('/').slice(0, -2).join('/') + '/' + apiFile.split('/').slice(-1)
  }
  let api = helperFunctions.parseYaml(apiFile)

  if (mergeAllofs) {
    api = runAllofMerge(api)
  }

  if (descriptionsFile) {
    api = await fillApiDescriptions(api, descriptionsFile, apiFile, resetDescriptionKeys, noSortKeys, separator, outputYamlPath)
  }

  if (examplesFile) {
    api = await fillApiExamples(api, examplesFile, apiFile, noSortKeys, outputYamlPath)
  }

  let apiMarkdown = await runWiddershins(api, languages, widdershinsTemplates, showSummaryKeys)
  apiMarkdown = postProcessImagesAfterWiddershins(apiMarkdown)
  apiMarkdown = postProcessIndentsAfterWiddershins(apiMarkdown)
  fs.writeFileSync(outputDir + '/' + outputFileStem + '.md', apiMarkdown)
  if (!apiFile.includes('okms')) {
    apiMarkdown = postDocsOutscaleComLinks(apiMarkdown)
  }
  runShins(apiMarkdown, shinsTemplates, `${outputDir}/modules/ROOT/pages/${outputFileStem}.adoc`)

  if (errorsFile) {
    if (!fs.existsSync(errorsFile)) {
      errorsFile = errorsFile.split('/').slice(0, -2).join('/') + '/' + errorsFile.split('/').slice(-1)
    }
    const errors = helperFunctions.parseYaml(errorsFile)
    const errorsMarkdown = generateErrorMarkdown(errors, api)
    runShins(errorsMarkdown, shinsTemplates, `${outputDir}/modules/ROOT/pages/${outputFileStem}-errors.adoc`)
  }

  if (oscCliPartials) {
    generateOscCliPartials(apiMarkdown, api, `${outputDir}/modules/ROOT/partials`, outputFileStem)
  }

  if (oapiCliPartials) {
    generateOapiCliPartials(apiMarkdown, api, `${outputDir}/modules/ROOT/partials`)
  }
}

function runAllofMerge (api) {
  // https://www.npmjs.com/package/allof-merge#documentation
  const allofMergeOptions = {
    onMergeError: (msg) => {throw new Error(msg)},
    onRefResolveError: (msg) => {throw new Error(msg)},
  }
  
  return allofMerge.merge(api, allofMergeOptions)
}

function runWiddershins (api, languages, widdershinsTemplates, showSummaryKeys) {
  console.log = turnOffConsoleLog()

  api = appendWebhooksToApiPaths(api)
  api = appendComponentResponsesToComponentSchemas(api)
  api = concatenateOneOfsAndAnyOfs(api)

  const languageTabs = getLanguageTabs(languages)

  // https://github.com/Mermade/widdershins/blob/main/README.md#options
  const widdershinsOptions = {
    expandBody: true,
    omitBody: true,
    codeSamples: languageTabs.length > 0,
    language_tabs: languageTabs,
    user_templates: widdershinsTemplates,
    sample: true,
    showSummaryKeys: showSummaryKeys,
    templateCallback: function myCallBackFunction (_, stage, data) {
      if (stage === 'pre') widdershinsPreProcess.preProcess(data)
      return data
    },
  }
  const apiMarkdown = widdershins.convert(api, widdershinsOptions)
  console.log = turnOnConsoleLog()

  return apiMarkdown
}

function appendWebhooksToApiPaths (api) {
  const webhooks = Object.entries(api.webhooks || {})
  for (const [k, v] of webhooks) {
    for (const verb of VERBS) {
      if (v[verb]) {
        v[verb]['x-webhook'] = true
      }
    }
    if (api.paths) {
      api.paths[k] = v
    }
  }

  return api
}

function appendComponentResponsesToComponentSchemas (api) {
  const responses = Object.entries(api.components?.responses || {})
  for (const [k, v] of responses) {
    const firstContentKey = Object.keys(v.content || {})[0]
    if (firstContentKey && !api.components.schemas[k]) {
      api.components.schemas[k] = api.components.responses[k].content[firstContentKey].schema
    }
  }

  return api
}

function concatenateOneOfsAndAnyOfs (api) {
  const paths = Object.values(api.paths || {})
  for (const path of paths) {
    concatenateOneOfsAndAnyOfs2(path)
    const operations = Object.values(path)
    for (const operation of operations) {
      concatenateOneOfsAndAnyOfs2(operation.requestBody?.content || {})
    }
  }
  concatenateOneOfsAndAnyOfs2(api.components?.schemas || {})

  return api
}

function concatenateOneOfsAndAnyOfs2 (obj) {
  const values = Object.values(obj)
  for (const n of values) {
    const paramsOrProps = n.parameters || Object.values(n.properties || n.schema?.properties || {})
    for (const paramOrProp of paramsOrProps) {
      const p = paramOrProp.schema || paramOrProp
      let xxxOf = p.anyOf || p.oneOf
      if (xxxOf) {
        p['x-types'] = []
        p['x-formats'] = []
        p['x-hasProperties'] = []
        for (const n of xxxOf) {
          const entries = Object.entries(n)
          for (const [k, v] of entries) {
            if (k === 'type') {
              p['x-types'].push(v)
              if (!p.type) {p.type = v}
            } else if (k === 'format') {
              p['x-formats'].push(v)
              if (!p.format) {p.format = v}
            } else {
              if (p[k]) {}
              else {p[k] = v}
            }
          }
          if (!n.properties) {
            p['x-hasProperties'].push(false)
          } else {
            p['x-hasProperties'].push(true)
            delete n.type
          }
        }
        if (p['x-hasProperties'].filter((x) => x === false).length) {
          delete p.anyOf
          delete p.oneOf
        } else {
          delete p.properties
          delete p.required
        }
      }
      xxxOf = p.items?.anyOf || p.items?.oneOf
      if (xxxOf) {
        p.items['x-types'] = []
        p.items['x-formats'] = []
        p.items['x-hasProperties'] = []
        for (const n of xxxOf) {
          const entries = Object.entries(n)
          for (const [k, v] of entries) {
            if (k === 'type') {
              p.items['x-types'].push(v)
              if (!p.items.type) {p.items.type = v}
            } else if (k === 'format') {
              p.items['x-formats'].push(v)
              if (!p.items.format) {p.items.format = v}
            } else {
              if (p.items[k]) {}
              else {p.items[k] = v}
            }
          }
          if (!n.items?.properties) {
            p.items['x-hasProperties'].push(false)
          } else {
            p.items['x-hasProperties'].push(true)
            delete n.items.type
          }
        }
        if (p.items['x-hasProperties'].filter((x) => x === false).length) {
          delete p.items.anyOf
          delete p.items.oneOf
        } else {
          delete p.items.properties
          delete p.items.required
        }
      }
    }
  }
}

function getLanguageTabs (languages) {
  const tabs = []
  if (languages) {
    const map = {
      csharp: 'C#',
      go: 'Go',
      http: 'HTTP',
      java: 'Java',
      javascript: 'JavaScript',
      nodejs: 'Node.js',
      php: 'PHP',
      python: 'Python',
      ruby: 'Ruby',
      'shell--curl': 'Curl',
      'shell--oapi-cli': 'oapi-cli',
      'shell--osc-cli': 'OSC CLI',
      'text--hcl': 'HCL',
    }
    languages = languages.split(',')
    for (let i = 0; i < languages.length; i++) {
      let key = languages[i].trim()
      // The following 3 lines are for backward compatibility
      if (key === 'console') key = 'shell--osc-cli'
      else if (key === 'console--oapi-cli') key = 'shell--oapi-cli'
      else if (key === 'shell') key = 'shell--curl'
      tabs.push({ [key]: map[key] })
    }
  } else {
    tabs.push({ http: 'HTTP' })
  }

  return tabs
}

function postProcessImagesAfterWiddershins (apiMarkdown) {
  // Remove attributes in Markdown images
  return apiMarkdown.replace(/(!\[.+?\]\(.+?) =.+?\)/g, '$1)')
}

function postProcessIndentsAfterWiddershins (apiMarkdown) {
  const tables = apiMarkdown.match(/(?<=\n)\|[\s\S]+?\|(?=\n\n)/g)
  for (const table of tables) {
    const lines = table.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const indents = lines[i].matchAll(/»/g)
      for (const indent of indents) {
        let k
        for (k = i + 1; k < lines.length && lines[k].substring(indent.index, indent.index + 1) === '»'; k++) {}
        for (k = k - 1; k > i && lines[k].substring(indent.index + 1, indent.index + 2) === '»'; k--) {
          lines[k] = lines[k].substring(0, indent.index) + '▉' + lines[k].substring(indent.index + 1)
        }
      }
      const rightIndent = lines[i].match(/»(?= )/)
      if (rightIndent) {
        let pipe = '├'
        if (i + 1 === lines.length || lines[i + 1].substring(rightIndent.index, rightIndent.index + 1) !== '»') {
          pipe = '└'
        }
        lines[i] = lines[i].substring(0, rightIndent.index) + pipe + lines[i].substring(rightIndent.index + 1)
      }
    }
    let newTable = lines.join('\n').replace(/»/g, '│')
    if (newTable.includes('$')) {
      newTable = newTable.replace(/\$/g, '$$$$')
    }
    apiMarkdown = apiMarkdown.replace(table, newTable)
  }

  return apiMarkdown
}

function postDocsOutscaleComLinks (apiMarkdown) {
  return apiMarkdown.replaceAll('https://docs.outscale.com/', '')
}

function runShins (markdown, shinsTemplates, outputFile) {
  console.log = turnOffConsoleLog()

  // https://github.com/Mermade/shins/blob/master/README.md#api
  const shinsOptions = {
    customCss: true,
    root: shinsTemplates,
    layout: 'layout.ejs',
  }
  shins.render(markdown, shinsOptions, function (err, html) {
    if (err) {
      console.error(err)
    } else {
      html = postProcessIndentsAfterShins(html)
      html = postProcessExtraHighlights(html)
      html = postProcessCollapsibles(html)
      html = postProcessLinksInHclExamples(html)
      html = postProcessDeprecateTags(html)
      html = postProcessAdmonitionsInTables(html)
      const title = html.match(/(?<=<h1.*?>).+?(?=<\/h1>)/)[0]
      fs.mkdirSync(path.parse(outputFile).dir, { recursive: true })
      fs.writeFileSync(outputFile, '= ' + title + '\n:page-role: apidocs\n:noindex:\n\n++++\n' + html + '\n++++\n')
    }
  })
  console.log = turnOnConsoleLog()
}

function postProcessIndentsAfterShins (html) {
  function replacer1 (match, p1) {
    return '<td class="indent-' + p1.length + '">' + p1.replace(/[├│└▉]/g, replacer2)
  }
  function replacer2 (match, offset) {
    let type
    if (match === '│') type = 'pipe'
    else if (match === '├') type = 'pipe node'
    else if (match === '└') type = 'pipe node last'
    else if (match === '▉') return ''
    return '<span class="' + type + ' indent-' + (offset + 1) + '"></span>'
  }
  html = html.replace(/<td>([├│└▉]+?) /g, replacer1)

  return html
}

function postProcessExtraHighlights (html) {
  html = html.replace(/----highlight-string-start----/g, '<span class="hljs-string">')
  html = html.replace(/----highlight-comment-start----/g, '<span class="hljs-comment">')
  html = html.replace(/----highlight-end----/g, '</span>')

  return html
}

function postProcessCollapsibles (html) {
  html = html.replace(/<p>----details-start( open)?----<\/p>/g, '<details$1>')
  html = html.replace(/<p>----summary-start----<\/p>/g, '<summary>')
  html = html.replace(/<p>----summary-end----<\/p>/g, '</summary>')
  html = html.replace(/<p>----details-end----<\/p>/g, '</details>')

  return html
}

function postProcessDeprecateTags (html) {
  const headingsWithADeprecateTag = new RegExp('(<h2.*?>.+?)(</h2>)\n<p*?>(----Deprecated----)</p>', 'g')
  html = html.replace(headingsWithADeprecateTag, '$1$3$2')

  const idMatches = html.matchAll(/(?<=<h2 id=").+?(?=".+----Deprecated----)/g)
  for (const idMatch of idMatches) {
    const linksInLeftMenu = new RegExp('(<a href="#' + idMatch[0] + '".+?)(</a>)', 'g')
    html = html.replace(linksInLeftMenu, '$1----Deprecated----$2')
  }

  html = html.replace(/----Deprecated----/g, ' <span class="deprecated">Deprecated</span>')

  return html
}

function postProcessLinksInHclExamples (html) {
  function replacer (match) {
    return match.replace(
      /(resources|data-sources)\/(.+?)\b/g,
      '<a href="https://registry.terraform.io/providers/outscale/outscale/latest/docs/$1/$2">outscale_$2</a>'
    )
  }
  return html.replace(/<pre class="highlight tab tab-text--hcl">([\s\S]+?)<\/pre>/g, replacer)
}

function postProcessAdmonitionsInTables (html) {
  html = html.replace(
    /&gt; (\[.+?\])(<br \/>)+&gt; (.+?)(<br \/>)+/g,
    '<blockquote class="admonition-in-table"><p>$1<br />$3<br /></p></blockquote>'
  )

  return html
}

function turnOffConsoleLog () {
  return function () {}
}

function turnOnConsoleLog () {
  return CONSOLE_LOG
}

if (path.parse(process.argv[1]).base === path.parse(__filename).base) {
  runInCli()
}

module.exports = runInNode
