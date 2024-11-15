const fs = require('fs')
const { execSync } = require('node:child_process')

module.exports.register = function ({ config }) {
  const uiBuildDir = __dirname + '/build'

  this.once('beforeProcess', () => {
    fs.rmSync(uiBuildDir, { force: true, recursive: true })
    if (fs.existsSync(__dirname + '/../node_modules/gulp/bin')) {
      execSync('node ../node_modules/gulp/bin/gulp.js --gulpfile gulpfile.js', { cwd: __dirname })
    }
    else {
      execSync('node ./node_modules/gulp/bin/gulp.js --gulpfile ./node_modules/@outscale/antora-ui/gulpfile.js')
    }
  })

  this.once('uiLoaded', () => {
    fs.rmSync(uiBuildDir, { force: true, recursive: true })
  })
}
