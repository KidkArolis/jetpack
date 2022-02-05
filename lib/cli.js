const program = require('commander')
const getOptions = require('./options')
const createLogger = require('./logger')
const pkg = require('../package.json')

module.exports = { run, options }

let command = 'dev'
const setCommand = (name) => () => {
  command = name
}

program
  .version(pkg.version)
  .arguments('[path]')
  .option('-p, --port <n>', 'port, defaults to 3030', Number)
  .option('-d, --dir [path]', 'run jetpack in the context of this directory')
  .option('-x, --exec [path]', 'execute an additional process, e.g. an api server')
  .option(
    '-j, --jsx <pragma>',
    'specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed'
  )
  .option('-r, --no-hot', 'disable hot reloading', null)
  .option('-u, --no-minify', 'disable minification', null)
  .option('-c, --config', 'config file to use, defaults to jetpack.config.js')
  .option('-m, --modern', 'build a modern bundle')
  .option('-l, --legacy', 'build a legacy bundle')
  .option('-i, --print-config', 'print the config used')
  .option('-q, --quiet', 'log no output')
  .option('--no-progress', 'disable progress logging', null)
  .option('-v, --verbose', 'log verbose output')

program.command('dev', { isDefault: true }).description('run the dev server').action(setCommand('dev'))

program.command('build').description('build for production').action(setCommand('build'))

program.command('inspect').description('analyze bundle').action(setCommand('inspect'))

program
  .command('browsers')
  .option('--coverage [country]', 'display coverage, e.g. --coverage, --coverage=US')
  .description('print supported browsers')
  .action(setCommand('browsers'))

program.command('clean').description('remove the dist dir').action(setCommand('clean'))

program.on('--help', function (here) {
  const webpackPkg = require('webpack/package.json')
  console.log()
  console.log('Examples:')
  console.log('  jetpack')
  console.log('  jetpack inspect ./my/app')
  console.log('  jetpack --port 3500 --verbose ./my/app')
  console.log('  jetpack --exec')
  console.log("  jetpack --exec 'nodemon ./server.js'")
  console.log()
  console.log('Versions:')
  console.log(`  Jetpack ${pkg.version}`)
  console.log(`  Webpack ${webpackPkg.version}`)
  console.log()
})

program.parse(process.argv)

// if target path matches one of the commands
// that currently breaks, workaround by prepending ./
// or similar to your path if you really need to use
// a path named build or inspect, etc.
if (command === program.args[0]) {
  program.args.shift()
}

if (!program.rawArgs.includes('--no-hot') && !program.rawArgs.includes('-r')) {
  delete program.hot
}

if (!program.rawArgs.includes('--no-minify') && !program.rawArgs.includes('-u')) {
  delete program.minify
}

function options() {
  return getOptions(command, program)
}

function run() {
  const opts = options()
  const log = createLogger(opts.verbose, opts.quiet)
  process.chdir(opts.dir)
  require(`./${command}`)(opts, log)
}
