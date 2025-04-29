const fs = require('fs')
const path = require('path')
const helperFunctions = require('./helper_functions')
const git = require('isomorphic-git')
const http = require("isomorphic-git/http/node")
const onAuth = require('./system-git-credential-manager').callGitCredentialFill

try {
  require('mac-ca').addToGlobalAgent()
}
catch (e) {}

const COLOR = "\u001b[36m'"
const CLR = "'\u001b[0m"

async function runInCli () {
  const options = helperFunctions.parseArgs()

  if (!options.url || !options.ref) {
    console.log('Please specify --url and --ref.')
    process.exit(1)
  }
  options.outputDir = new URL(options.url).pathname.replace(/^.+\//, '').replace(/\.git$/, '')

  await cloneRepository(options.outputDir, options.url, options.apiRef)
}

async function runInNode (options) {
  let url = new URL(options.apiUrl)
  const name = url.pathname.replace(/^\//, '').replace(/\.git$/, '')
  const dir = options.outputDir + '/' + options.repoName + '/' + name.replace(/^.+\//, '')

  if (process.env.GITLAB_CI) {
    url.href = url.href.replace('https://', 'https://gitlab-ci-token:' + process.env.CI_JOB_TOKEN + '@')
  }

  const userguideBranch = await git.currentBranch({ fs, dir: '.' })
  const triggerRef = process.env.TRIGGER_REF
  if (triggerRef && await doesRefExists(url, triggerRef)) {
    console.log(`We will download the repository ${COLOR}${name}${CLR} (tag or branch ${COLOR}${triggerRef}${CLR}), as required by '${options.repoName}'`)
    await cloneRepository(dir, url, triggerRef)
  }
  else if (options.apiRef === 'HEAD' || userguideBranch === 'main' || userguideBranch === 'master') {
    console.log(`We will download the repository ${COLOR}${name}${CLR} (default branch), as required by '${options.repoName}'`)
    await cloneRepository(dir, url, undefined)
  }
  else if (await doesRefExists(url, options.apiRef)) {
    console.log(`We will download the repository ${COLOR}${name}${CLR} (tag or branch ${COLOR}${options.apiRef}${CLR}), as required by '${options.repoName}'`)
    await cloneRepository(dir, url, options.apiRef)
  }
  else {
    console.log(`We will download the repository ${COLOR}${name}${CLR} (default branch), as required by '${options.repoName}'`)
    await cloneRepository(dir, url, undefined)
  }

}

async function doesRefExists (url, ref) {
  const serverRefs = await git.listServerRefs({ http, onAuth, url: url.href, protocolVersion: 1 })
  const m = serverRefs.filter((n) => n.ref.replace('refs/heads/', '') === ref)
  if (m.length) {
    return true
  }
  else {
    return false
  }
}

async function cloneRepository (dir, url, ref) {
  await git.clone({ fs, http, onAuth, dir, url, ref, singleBranch: true, depth: 1 })
}

if (path.parse(process.argv[1]).base === path.parse(__filename).base) {
  runInCli()
}

module.exports = runInNode
