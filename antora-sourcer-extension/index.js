const fs = require('fs')
const expandPath = require('@antora/expand-path-helper')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const onAuth = require('../antora-extension/lib/system-git-credential-manager').callGitCredentialFill

const REMOTE_URL_REGEX = /(:\/\/.+?\/|:)[^\/\\]/
const COLOR = "\u001b[36m'"
const CLEAR = "'\u001b[0m"

module.exports.register = function () {

  this.once('contextStarted', async ({ playbook }) => {
    const playbookBranch = process.env.SAME_AS_PLAYBOOK || await git.currentBranch({ fs, dir: '.' })
    const sources = playbook.content.sources
    const promises = []
    for (let i = 0, length = sources.length; i < length; i++) {
      promises.push(processSource(sources[i], playbookBranch).then((n) => {sources[i] = n}))
    }
    await Promise.all(promises)
    printSourcesInfo(sources)
  })

}

async function processSource (n, playbookBranch) {
  if (n.xUrl) {
    const localPath = n.url + '/' + (n.startPath || '')
    if (fs.existsSync(expandPath(localPath)) === false && n.xUrl.match(REMOTE_URL_REGEX)) {
      n.url = n.xUrl
      if (n.xBranches && n.xBranches.includes('$SAME_AS_PLAYBOOK')) {
        let url = n.url
        if (process.env.GITLAB_CI) {
          url = url.replace('https://', 'https://gitlab-ci-token:' + process.env.CI_JOB_TOKEN + '@')
        }
        const serverRefs = await git.listServerRefs({ http, onAuth, url, protocolVersion: 1 })
        n.branches = await identifyPlaybookBranch(serverRefs, n.xBranches, playbookBranch)
      }
    }
  }

  return n
}

async function identifyPlaybookBranch (serverRefs, xBranches, playbookBranch) {
  if (typeof xBranches === 'string') {
    xBranches = [xBranches]
  }
  for (let i = 0, length = xBranches.length; i < length; i++) {
    if (xBranches[i] === '$SAME_AS_PLAYBOOK') {
      xBranches[i] = getBranchIfExists(serverRefs, playbookBranch) || getDefaultBranch(serverRefs)
    }
  }

  return xBranches
}

function getBranchIfExists (serverRefs, test) {
  const m = serverRefs.filter((n) => n.ref.replace('refs/heads/', '') === test)
  if (m.length) {
    return test
  }
}

function getDefaultBranch (serverRefs) {
  const headCommitId = serverRefs.filter((n) => n.ref === 'HEAD')[0].oid
  const m = serverRefs.filter((n) => (n.oid === headCommitId && n.ref.startsWith('refs/heads/')))

  return m[0].ref.replace('refs/heads/', '')
}

function printSourcesInfo (sources) {
  for (let i = 0, length = sources.length; i < length; i++) {
    const url = sources[i].url
    if (sources[i].url.match(REMOTE_URL_REGEX)) {
      let branches = sources[i].branches
      let word = 'branch'
      if (Array.isArray(branches) && branches.length > 1) {
        branches = branches.join(CLEAR + ', ' + COLOR)
        word = 'branches'
      }
      console.log(`We will use the remote repo ${COLOR}${url}${CLEAR} (${word} ${COLOR}${branches}${CLEAR})`)
    } else if (url !== '.') {
      console.log(`We will use your local repo ${COLOR}${url}${CLEAR}`)
    }
  }
}
