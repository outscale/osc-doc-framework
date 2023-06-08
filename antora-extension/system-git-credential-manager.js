'use strict'

const { spawn } = require('child_process')

function callGitCredentialFill (url) {
  const { protocol, host } = new URL(url)
  return new Promise((resolve, reject) => {
    const output = []
    const process = spawn('git', ['credential', 'fill'])
    process.on('close', (code) => {
      if (code) return reject(code)
      const { username, password } = output.join('\n').split('\n').reduce((acc, line) => {
        if (line.startsWith('username') || line.startsWith('password')) {
          const [key, val] = line.split('=')
          acc[key] = val
        }
        return acc
      }, {})
      resolve(password ? { username, password } : username ? { token: username } : undefined)
    })
    process.stdout.on('data', (data) => output.push(data.toString().trim()))
    process.stdin.write(`protocol=${protocol.slice(0, -1)}\nhost=${host}\n\n`)
  })
}

module.exports = {
  configure () {
    this.urls = {}
  },
  async fill ({ url }) {
    this.urls[url] = 'requested'
    if (process.env.GITLAB_CI) {
        return { username: 'gitlab-ci-token', password: process.env.CI_JOB_TOKEN }
    }
    else {
        return callGitCredentialFill(url)
    }
  },
  async approved ({ url }) {
    this.urls[url] = 'approved'
  },
  async rejected ({ url, auth }) {
    this.urls[url] = 'rejected'
    const data = { statusCode: 401, statusMessage: 'HTTP Basic: Access Denied' }
    const err = new Error(`HTTP Error: ${data.statusCode} ${data.statusMessage}`)
    err.name = err.code = 'HttpError'
    err.data = data
    if (auth) err.rejected = true
    throw err
  },
  status ({ url }) {
    return this.urls[url]
  },
}
