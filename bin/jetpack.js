#!/usr/bin/env node

const program = require('commander')
let build = false

program
  .version(require('../package.json').version)
  .arguments('[dir]')
  .option('-p, --port <n>', 'Port, defaults to 3000', Number)
  .option('-j, --jsx <pragma>', 'Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed')
  .option('--public <path>', 'Public directory from which static assets will be served by the dev server')
  .option('--html <path>', 'Path to html file that will be rendered by the dev server')

program
  .command('build [dir]')
  .action(function (dir) {
    build = true
  })

program.parse(process.argv)

if (program.args[0]) {
  process.chdir(program.args[0])
}

require('../server/server')(clean({
  build: build,
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
