const fs = require('fs')
const git = require('isomorphic-git')
const gitCredentialManager = require('./system-git-credential-manager')
const onAuth = gitCredentialManager.callGitCredentialFill
const http = require('isomorphic-git/http/node')

const dir = './node_modules/@outscale/osc-doc-framework'
const ref = 'main'

async function checkUpdate () {
  const log = await git.log({ fs, dir, depth: 1 })
  const localCommitId = log[0].oid
  let url = await git.getConfig({ fs, dir, path: 'remote.origin.url' })
  if (url.startsWith('git@')) {
    url = url.replace(/git@(.+?):/, 'https://$1/')
  }

  const fetch = await git.fetch({ fs, http, onAuth, dir, url, singleBranch: true, ref, singleBranch: true })
  const remoteCommitId = fetch.fetchHead

  if (localCommitId !== remoteCommitId) {
    console.log(
      '\u001b[33m\n'
      + 'Update available for osc-doc-framework!\n\n'
      + 'Your local osc-doc-framework repository is behind the remote.\n'
      + 'Please git pull it before generating.\n\n'
      + '(If you absolutely want to generate without updating, disable the "update_checker" key in the playbook.)\n'
      + '\u001b[0m'
    )
    return true
  } else {
    return false
  }
}

module.exports = checkUpdate
