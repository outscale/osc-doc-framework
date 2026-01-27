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
  const logPath = outputDir + '/.logs/' + outputFileStem

  if (!fs.existsSync(apiFile)) {
    apiFile = apiFile.split('/').slice(0, -2).join('/') + '/' + apiFile.split('/').slice(-1)
  }
  let api = helperFunctions.parseYaml(apiFile)

  if (mergeAllofs) {
    api = runAllofMerge(api)
  }

  if (descriptionsFile) {
    api = await fillApiDescriptions(api, descriptionsFile, apiFile, resetDescriptionKeys, separator, logPath)
  }

  if (examplesFile) {
    api = await fillApiExamples(api, examplesFile, apiFile, logPath)
  }

  if (outputYamlPath) {
    const s = helperFunctions.dumpYaml(api, noSortKeys)
    const dir = path.parse(outputYamlPath).dir
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(outputYamlPath, s)
  }

  let apiMarkdown = await runWiddershins(api, languages, widdershinsTemplates, showSummaryKeys)
  apiMarkdown = postProcessButtonsAfterWiddershins(apiMarkdown)
  apiMarkdown = postProcessImagesAfterWiddershins(apiMarkdown)
  apiMarkdown = postProcessIndentsAfterWiddershins(apiMarkdown)
  apiMarkdown = postProcessXxxOfRowsToMerge(apiMarkdown)
  fs.writeFileSync(outputDir + '/' + outputFileStem + '.md', apiMarkdown)
  if (!apiFile.includes('okms')) {
    apiMarkdown = postDocsOutscaleComLinks(apiMarkdown)
  }
  runShins(apiMarkdown, shinsTemplates, `${outputDir}/modules/ROOT/pages/${outputFileStem}.adoc`, false)

  if (errorsFile) {
    if (!fs.existsSync(errorsFile)) {
      errorsFile = errorsFile.split('/').slice(0, -2).join('/') + '/' + errorsFile.split('/').slice(-1)
    }
    const errors = helperFunctions.parseYaml(errorsFile)
    const errorsMarkdown = generateErrorMarkdown(errors, api)
      runShins(errorsMarkdown, shinsTemplates, `${outputDir}/modules/ROOT/pages/${outputFileStem}-errors.adoc`, true)
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

  api = processApi(api)
  api = appendComponentResponsesToComponentSchemas(api)
  api = appendWebhooksToApiPaths(api)

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

function processApi (api) {
  const tags = []

  const pathItemsGroups = [api.paths, api.webhooks, api.components?.pathItems]
  for (const pathItems of pathItemsGroups) {
    for (const v of Object.values(pathItems || {})) {
      processObj(v)
      for (const verb of VERBS) {
        processObj(v[verb])
        if (v[verb]?.tags) {
          for (const tag of v[verb].tags) {
            tags.push({ name: tag })
          }
        }
      }
    }
  }

  const fields = ['schemas', 'responses', 'parameters', 'examples', 'requestBodies', 'headers', 'securitySchemes', 'links', 'callbacks']
  const components = api.components || {}
  for (const field of fields) {
    const obj = Object.values(components[field] || {})
    for (const v of obj) {
      processObj(v)
    }
  }

  api.tags = processTags(api.tags || [], tags)

  return api
}

function processObj (obj) {
  if (obj) {
    if (obj.examples?.length > 1) {
      obj.example = obj.examples[0]
      obj['x-examples'] = obj.examples
      delete obj.examples
    }

    const mediaTypes = Object.values(obj.content || {})
    for (const mediaType of mediaTypes) {
      processObj(mediaType)
    }
    processObj(obj.schema)

    const xxxOfs = ['allOf', 'anyOf', 'oneOf']
    for (const xxxOf of xxxOfs) {
      if (obj[xxxOf]) {
        for (const n of obj[xxxOf]) {
          processObj(n)
        }
        obj = concatenateXxxOfs(obj, xxxOf)
      }
    }

    const parameters = obj.parameters || []
    for (const parameter of parameters) {
      processObj(parameter)
    }

    const properties = Object.values(obj.properties || {})
    for (const property of properties) {
      processObj(property)
      processObj(property.items)
    }
    const responses = Object.values(obj.responses || {})
    for (const response of responses) {
      processObj(response)
    }
    const headers = Object.values(obj.headers || {})
    for (const header of headers) {
      processObj(header)
    }
  }
}

function concatenateXxxOfs (obj, xxxOf) {
  // Concatenate anyOfs and oneOfs that have one entry with type:null
  const arrWithTypeNull = obj[xxxOf].filter((x) => x.type === 'null')
  let arrOthers = obj[xxxOf].filter((x) => x.type !== 'null')
  if (arrWithTypeNull.length) {
    for (let n of arrOthers) {
      const subXxxOf = n.anyOf || n.oneOf
      if (subXxxOf) {
        for (const subN of subXxxOf) {
          subN['x-nullable'] = true
        }
        arrOthers = subXxxOf
      } else {
        n['x-nullable'] = true
      }
    }
    obj[xxxOf] = arrOthers
  }

  // Concatenate anyOfs and oneOfs that have the same type but different formats
  if (obj[xxxOf].length > 1) {
    const testType = obj[xxxOf][0].type
    let arrWithSameTypes = obj[xxxOf].filter((x) => x.type === testType && x.format)
    if (arrWithSameTypes.length === obj[xxxOf].length) {
      const formats = []
      for (const n of obj[xxxOf]) {
        formats.push(n.format)
        for (const [k, v] of Object.entries(n)) {
          obj[k] = v
        }
      }
      obj.format = formats.join(' or ')
      delete obj[xxxOf]
    }
  }

  return obj
}

function processTags (apiTags, tags) {
  for (const tag of tags) {
    const tagIsNotAlreadyInTheArray = apiTags.filter((x) => x.name === tag.name).length === 0
    if (tagIsNotAlreadyInTheArray) {
      apiTags.push(tag)
    }
  }
  apiTags.sort(sortTags)

  return apiTags
}

function sortTags (a, b) {
  const nameA = a.name
  const nameB = b.name
  if (nameA < nameB) {
    return -1
  }
  if (nameA > nameB) {
    return 1
  }

  return 0
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

function postProcessButtonsAfterWiddershins (apiMarkdown) {
  return apiMarkdown.replace(/<button>/g, '----button-start----').replace(/<\/button>/g, '----button-end----')
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

function postProcessXxxOfRowsToMerge (apiMarkdown) {
  const regex1 = /^\|(.+?(anyOf|oneOf)\/0.+?)\|(.+?)\|(.*?)\|\n\|(?:.+?\2.+?)\|(.+?)\|(.*)\|/gm
  function replacer1 (match, p1, p2, p3, p4, p5, p6) {
    p4 = p4.match(/(Array size: |Length:|Pattern:|Multiple of:|Minimum value:|Maximum value:|Possible values:|Default:|Example:|Value:).+/)?.[0] || ''
    p6 = p6.match(/(Array size: |Length:|Pattern:|Multiple of:|Minimum value:|Maximum value:|Possible values:|Default:|Example:|Value:).+/)?.[0] || ''

    let description
    if (p3.endsWith('[oneOf undefined]')) {
      description = p4 + '<br /><br />' + p6
    } else {
      description = p4 + '<br />or<br />' + p6
    }
    if (description.startsWith('<br />or<br />')) {
      description = description.replace(/^<br \/>or<br \/>/, '')
    }

    let type
    if (p3.startsWith('oneOf:<br />') && p5.startsWith('oneOf:<br />')) {
      p5 = p5.replace(/^oneOf:<br \/>/, '')
    }
    if (p3.endsWith('[oneOf undefined]')) {
      p3 = p3.replace(/,<br \/>or \[oneOf undefined\]$/, '')
      p5 = '[' + p5.split(',<br />or ').join('],<br />or [') + ']'
    }
    if (p3.startsWith(p2 + ':<br />')) {
      type = p5
    } else {
      type = p3 + ',<br />or ' + p5
    }

    return '|' + p1 + '|' + type + '|' + description + '|'
  }
  while (apiMarkdown.match(regex1)) {
    apiMarkdown = apiMarkdown.replace(regex1, replacer1)
  }

  const regex2 = /^\|([^-].+?)\|(.+?)\|(.*?)\|\n\|.+?(?:anyOf|oneOf)\/0.+?\|(.+?)\|(.*?)\|\n/gm
  function replacer2 (match, p1, p2, p3, p4, p5) {
    let type = p4.replace(/\[[^<>]+?\]\(#[^<>]+?\) undefined,<br \/>or /g, '')
    if (p4.includes('null,<br />or ')) {
      type = p4.replace(/null,<br \/>or /g, '') + ',<br />or null'
    }
    if (p2.startsWith('[') && p2.endsWith('],<br />or null')) {
      type = '[' + type.split(',<br />or ').join('],<br />or [') + ']' + '<br />or null'
    }
    else if (p2.startsWith('[') && p2.endsWith(']')) {
      type = '[' + type.split(',<br />or ').join('],<br />or [') + ']'
    }
    p5 = p5.replace(/<br \/>or<br \/><br \/>or<br \/>/, '<br />or<br />')
    let description
    if (p5) {
      description = p3 + '<br />' + p5
    } else {
      description = p3
    }
    const arrayInfo = description.includes('Array size:')
    const ValueInfo = description.match(/Length:|Pattern:|Multiple of:|Minimum value:|Maximum value:|Possible values:|Default:|Example:|Value:/g)
    if (
      (!arrayInfo && ValueInfo?.length)
      || (arrayInfo && ValueInfo?.length > 1)
    ) {
      description = description.replace(ValueInfo[0], '<br />' + ValueInfo[0])
    }
    return '|' + p1 + '|' + type + '|' + description + '|\n'
  }
  apiMarkdown = apiMarkdown.replace(regex2, replacer2)

  // Schemas section
  const regex3 = /^\|.+?\|(.+?)\|.+?\|\n\|---\|---\|---\|\n\|.+?(?:anyOf|oneOf)\/0.+?\|(.+?)\|.*?\|\n/gm
  function replacer3 (match, p1, p2) {
    p2 = p2.replace(/ undefined/g, '')
    return '|' + p1 + '|\n|---|\n|' + p2 + '|\n'
  }
  apiMarkdown = apiMarkdown.replace(regex3, replacer3)
  const regex4 = /^(\|.+?\|.+?) undefined(.*?\|.*?\|)$/gm
  apiMarkdown = apiMarkdown.replace(regex4, '$1$2')

  return apiMarkdown
}

function postDocsOutscaleComLinks (apiMarkdown) {
  return apiMarkdown.replaceAll('https://docs.outscale.com/', '')
}

function runShins (markdown, shinsTemplates, outputFile, unsafeFlag = false) {
  console.log = turnOffConsoleLog()

  // https://github.com/Mermade/shins/blob/master/README.md#api
  const shinsOptions = {
    customCss: true,
    layout: 'layout.ejs',
    root: shinsTemplates,
    unsafe: unsafeFlag,
  }
  shins.render(markdown, shinsOptions, function (err, html) {
    if (err) {
      console.error(err)
    } else {
      html = postProcessButtonsAfterShins(html)
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

function postProcessButtonsAfterShins (html) {
  return html.replace(/----button-start----/g, '<button>').replace(/----button-end----/g, '</button>')
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
