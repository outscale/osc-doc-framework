'use strict'

const { series } = require('gulp')
const createTask = require('./_gulp.d/lib/create-task')
const exportTasks = require('./_gulp.d/lib/export-tasks')
const task = require('./_gulp.d/tasks')

const buildTask = createTask({
  name: 'build',
  desc: 'Build and stage the UI assets for bundling',
  call: task.build('.', 'build/ui'),
})

const packTask = createTask({
  name: 'pack',
  desc: 'Create a bundle of the staged UI assets',
  call: task.pack('build/ui', 'build/ui-bundle.zip'),
})

const bundleTask = createTask({
  name: 'default',
  desc: 'Build and bundle the UI',
  call: series(buildTask, packTask),
})

module.exports = exportTasks(bundleTask)
