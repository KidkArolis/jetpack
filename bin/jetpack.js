#!/usr/bin/env node

const fs = require('fs')
const program = require('commander')
let build = false
let start = false
let entry = '.'

program
  .version(require('../package.json').version)
  .arguments('[dir]')
  .option('-p, --port <n>', 'Port, defaults to 3000', Number)
  .option('-j, --jsx <pragma>', 'Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed')
  .option('--public <path>', 'Public directory from which static assets will be served by the dev server')
  .option('--html <path>', 'Path to html file that will be rendered by the dev server')

program
  .command('build [dir]')
  .description('Build the app for production')
  .action(function (dir) {
    build = true
  })

program
  .command('start [dir]')
  .description('Serve a built app in production')
  .action(function (dir) {
    start = true
  })

program.parse(process.argv)

if (program.args[0]) {
  if (fs.lstatSync(program.args[0]).isDirectory()) {
    // if path provided is a directory, switch to it before proceeding
    // useful to run jetpack in projects that are somewhere else on the disk
    process.chdir(program.args[0])
  } else {
    // but if it's a file, we'll stay in current working directory
    // and will use this file as the entry point instead of the default
    // node resolution logic for '.'
    entry = program.args[0].trim()
    if (entry.indexOf('./') !== 0 && entry.indexOf('/') !== 0) {
      entry = './' + entry
    }
  }
}

require('../server/server')(clean({
  entry: entry,
  build: build,
  start: start,
  port: program.port,
  jsx: program.jsx,
  html: program.html,
  public: program.public
}))

function clean (obj) {
  return Object.keys(obj).reduce(function (memo, k) {
    if (obj[k] === undefined) return memo
    memo[k] = obj[k]
    return memo
  }, {})
}
