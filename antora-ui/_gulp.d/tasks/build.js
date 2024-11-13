'use strict'

const autoprefixer = require('autoprefixer')
const browserify = require('browserify')
const concat = require('gulp-concat')
const cssnano = require('cssnano')
const fs = require('fs-extra')
const merge = require('merge-stream')
const ospath = require('path')
const path = ospath.posix
const postcss = require('gulp-postcss')
const postcssImport = require('postcss-import')
const postcssUrl = require('postcss-url')
const postcssVar = require('postcss-custom-properties')
const { Transform } = require('stream')
const map = (transform) => new Transform({ objectMode: true, transform })
const terser = require('gulp-terser')
const terserConfig = {
  // compress: false,
  // mangle: false,
  // format: { beautify: true },
}
const vfs = require('vinyl-fs')

module.exports = (src, dest) => () => {
  const opts = { base: src, cwd: src }
  const postcssPlugins = [
    postcssImport,
    (css, { messages, opts: { file } }) =>
      Promise.all(
        messages
          .reduce((accum, { file: depPath, type }) => (type === 'dependency' ? accum.concat(depPath) : accum), [])
          .map((importedPath) => fs.stat(importedPath).then(({ mtime }) => mtime))
      ).then((mtimes) => {
        const newestMtime = mtimes.reduce((max, curr) => (!max || curr > max ? curr : max), file.stat.mtime)
        if (newestMtime > file.stat.mtime) file.stat.mtimeMs = +(file.stat.mtime = newestMtime)
      }),
    postcssUrl([
      {
        filter: (asset) => new RegExp('^[~][^/]*(?:fonts|typeface)[^/]*/.*/files/.+[.](?:ttf|woff2?)$').test(asset.url),
        url: (asset) => {
          const relpath = asset.pathname.slice(1)
          const abspath = require.resolve(relpath)
          const basename = ospath.basename(abspath)
          const destpath = ospath.join(dest, 'fonts', basename)
          if (!fs.pathExistsSync(destpath)) fs.copySync(abspath, destpath)
          return path.join('..', 'fonts', basename)
        },
      },
    ]),
    postcssVar({ preserve: true }),
    // NOTE to make vars.css available to all top-level stylesheets, use the next line in place of the previous one
    //postcssVar({ importFrom: path.join(src, 'css', 'vars.css'), preserve: true }),
    autoprefixer,
    (css, result) => cssnano({ preset: 'default' }).process(css, { from: undefined }).then(() =>
      postcssPseudoElementFixer(css, result)),
  ]

  const jsAllFiles = 'js/**/*.js'
  const jsNumberedFiles = 'js/+([0-9])*.js'
  const jsFilesAlreadyMinified = 'js/**/*.min.js'
  const jsOtherFiles = [jsAllFiles, `!${jsNumberedFiles}`, `!${jsFilesAlreadyMinified}`]

  const cssAllFiles = 'css/**/*.css'
  const cssNumberedFiles = 'css/+([0-9])*.css'
  const cssFilesAlreadyMinified = 'css/**/*.min.css'
  const cssOtherFiles = [cssAllFiles, `!${cssNumberedFiles}`, `!${cssFilesAlreadyMinified}`]

  return merge(
    vfs.src('ui.yml', { ...opts, allowEmpty: true }),
    vfs
      .src(jsNumberedFiles, { ...opts, read: false })
      .pipe(bundle(opts))
      .pipe(terser(terserConfig))
      .pipe(concat('js/site.js')),
    vfs
      .src(jsFilesAlreadyMinified, opts),
    vfs
      .src(jsOtherFiles, { ...opts, read: false })
      .pipe(bundle(opts))
      .pipe(terser(terserConfig)),
    vfs
      .src(cssNumberedFiles, { ...opts, read: false })
      .pipe(bundle(opts))
      .pipe(concat('css/site.css'))
      .pipe(postcss((file) => ({ plugins: postcssPlugins, options: { file } }))),
    vfs
      .src(cssFilesAlreadyMinified, opts),
    vfs
      .src(cssOtherFiles, opts),
    vfs.src('fonts/**/*', opts),
    vfs.src('img/**/*', opts),
    vfs.src('helpers/*.js', opts),
    vfs.src('layouts/*.hbs', opts),
    vfs.src('partials/*.hbs', opts),
    vfs.src('static/**/*[!~]', { ...opts, base: ospath.join(src, 'static'), dot: true })
  ).pipe(vfs.dest(dest))
}

function bundle ({ base: basedir, ext: bundleExt = '.bundle.js' }) {
  return map((file, enc, next) => {
    if (bundleExt && file.relative.endsWith(bundleExt)) {
      const mtimePromises = []
      const bundlePath = file.path
      browserify(file.relative, { basedir, detectGlobals: false })
        .plugin('browser-pack-flat/plugin')
        .on('file', (bundledPath) => {
          if (bundledPath !== bundlePath) mtimePromises.push(fs.stat(bundledPath).then(({ mtime }) => mtime))
        })
        .bundle((bundleError, bundleBuffer) =>
          Promise.all(mtimePromises).then((mtimes) => {
            const newestMtime = mtimes.reduce((max, curr) => (curr > max ? curr : max), file.stat.mtime)
            if (newestMtime > file.stat.mtime) file.stat.mtimeMs = +(file.stat.mtime = newestMtime)
            if (bundleBuffer !== undefined) file.contents = bundleBuffer
            next(bundleError, Object.assign(file, { path: file.path.slice(0, file.path.length - 10) + '.js' }))
          })
        )
      return
    }
    fs.readFile(file.path, 'UTF-8').then((contents) => {
      next(null, Object.assign(file, { contents: Buffer.from(contents) }))
    })
  })
}

function postcssPseudoElementFixer (css, result) {
  css.walkRules(/(?:^|[^:]):(?:before|after)/, (rule) => {
    rule.selector = rule.selectors.map((it) => it.replace(/(^|[^:]):(before|after)$/, '$1::$2')).join(',')
  })
}
