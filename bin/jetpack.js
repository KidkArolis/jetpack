#!/usr/bin/env node

const program = require('commander')

program
  .version(require('../package.json').version)
  .option('-p, --port <n>', 'Port, defaults to 3000', Number)
  .option('-j, --jsx <pragma>', 'Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed')
  .parse(process.argv)

require('../server/server')({
  port: program.port,
  jsx: program.jsx
})
