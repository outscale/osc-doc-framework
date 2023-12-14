const { execSync } = require("child_process")
const parseResourceId = require('@antora/content-classifier/lib/util/parse-resource-id')
const resolveResource = require('@antora/content-classifier/lib/util/resolve-resource')

module.exports.register = function ({ config: {format = '%cd'} }) {
  let contentAggregateCopy
  let gitLogs = {}

  this.once('contentAggregated', async ({ contentAggregate }) => {
    contentAggregateCopy = contentAggregate
  })

  this.on('uiLoaded', async ({ playbook }) => {
    playbook.env.GIT_LOG_EXTENSION = true
  })

  this.once('contentClassified', ({ contentCatalog }) => {
    gitLogs = getGitLogs(contentAggregateCopy, gitLogs, format)

    const pages = contentCatalog.getPages()
    for (let j = 0, length = pages.length; j < length; j++) {
      if (pages[j].src.origin) {
        const content = pages[j].contents.toString()
        let info = getInfoFromGitLogs(pages[j], gitLogs)
        info = parseIncludes(pages[j], content, info, gitLogs, contentCatalog)
        pages[j].contents = Buffer.from(`:page-gitlog: ${formatTime(info)}\n\n${content}`)
      }
    }
  })

  this.on('beforePublish', ({ playbook }) => {
    delete playbook.env.GIT_LOG_EXTENSION
  })

}

function getGitLogs(contentAggregate, gitLogs, format) {
  for (let i = 0, length = contentAggregate.length; i < length; i++) {
    const origins = contentAggregate[i].origins
    for (let j = 0, length = origins.length; j < length; j++) {
      const version = origins[j].descriptor.version || 'HEAD'
      const component = origins[j].descriptor.name
      const path = origins[j].gitdir.replace('/.git', '/') + origins[j].descriptor.name
      gitLogs[version] = gitLogs[version] || {}
      gitLogs[version][component] = getGitLog(version, path, format)
    }
  }

  return gitLogs
}

function getGitLog(version, path, format) {
  let nproc = 'nproc'
  if (process.platform === 'darwin') nproc = 'sysctl -n hw.logicalcpu'
  const gitLsTreeCmd = `git ls-tree -r --name-only ${version} ${path}/modules/*/*/ -z`
  const xargsCmd = `xargs -0n1 -I_ -P $(${nproc})`
  const gitLogCmd = `git log --follow --max-count=1 --format="_;${format}" --date=unix -- _`
  const output = execSync(`${gitLsTreeCmd} | ${xargsCmd} ${gitLogCmd}`)

  const data = {}
  let lines = output.toString().trimEnd().split('\n')
  for (let i = 0, length = lines.length; i < length; i++) {
    const s = lines[i].split(';')
    data[s[0]] = s[1]
  }

  // Handle uncommitted changes
  const status = execSync('git status -z | tr "\\0" "\\n"')
  lines = status.toString().trimEnd().split('\n')
  for (let i = 0, length = lines.length; i < length; i++) {
    const matches = lines[i].match(/(?<=[A-Z ?][A-Z ?] ).+/)
    if (matches) data[matches[0]] = Math.round(Date.now() / 1000)
  }

  return data
}

function getInfoFromGitLogs(file, gitLogs) {
  const version = file.src.version || 'HEAD'
  const component = file.src.component
  const startPath = file.src.origin.startPath
  const path = file.src.path.normalize('NFC')

  return gitLogs[version][component][`${startPath}/${path}`]
}

function parseIncludes(file, content, info, gitLogs, contentCatalog) {
  matches = content.match(/(include|image)::?.+?(?=\[.*?\])/g)
  if (matches) {
    for (let k = 0, length = matches.length; k < length; k++) {
      const resource = matches[k].replace(/(include|image)::?(\.\.\/+partials\/+)?/, '')
      const id = parseResourceId(resource)
      const version = id.version || file.src.version || '_'
      const component = id.component || file.src.component
      const module = id.module || file.src.module || 'ROOT'
      let family = id.family
      if (matches[k].startsWith('include::../partials/') || matches[k].startsWith('include::..//partials/')) {
        family = 'partial'
      }
      else if (matches[k].startsWith('image:')) family = 'image'
      const relative = id.relative
      const resolve = resolveResource(`${version}@${component}:${module}:${family}$${relative}`, contentCatalog)
      const info2 = getInfoFromGitLogs(resolve, gitLogs)
      if (info2 > info) info = info2
    }
  }

  return info
}

function formatTime(time) {
  let formattedTime = new Date(time * 1000).toISOString()
  formattedTime = formattedTime.split('T')[0]

  return formattedTime
}
