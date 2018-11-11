const program = require('commander')
const getOptions = require('./options')
const createLogger = require('./logger')
const pkg = require('../package.json')

module.exports = { run, options, logger }

let command = 'dev'
let setCommand = name => () => { command = name }

program
  .version(pkg.version)
  .arguments('[path]')
  .option('-p, --port <n>', 'Port, defaults to 3030', Number)
  .option('-d, --dir [path]', 'Run jetpack in the context of this directory', process.cwd())
  .option('-e, --exec [path]', 'Execute an additional process, e.g. an api server')
  .option('-j, --jsx <pragma>', 'Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed')
  .option('-h, --no-hot', 'Disable hot reloading')
  .option('-c, --config', 'Config file to use, defaults to jetpack.config.js')
  .option('-q, --quiet', 'Log no output')
  .option('-v, --verbose', 'Log verbose output')

program
  .command('build')
  .description('build for production')
  .action(setCommand('build'))

program
  .command('inspect')
  .description('show dependencies')
  .action(setCommand('inspect'))

program
  .command('clean')
  .description('remove the dist dir')
  .action(setCommand('clean'))

program.on('--help', function (here) {
  const webpackPkg = require('webpack/package.json')
  console.log()
  console.log()
  console.log('  Examples:')
  console.log()
  console.log('    $ jetpack')
  console.log('    $ jetpack inspect ./my/app')
  console.log('    $ jetpack --port 3500 --verbose ./my/app')
  console.log('    $ jetpack --server')
  console.log('    $ jetpack --server \'nodemon ./server.js\'')
  console.log()
  console.log()
  console.log('  Versions:')
  console.log()
  console.log(`    Jetpack ${pkg.version}`)
  console.log(`    Webpack ${webpackPkg.version}`)
  console.log()
})

program.parse(process.argv)

function options () {
  return getOptions(command, program)
}

function logger () {
  const opts = options()
  return createLogger(opts.verbose, opts.quiet)
}

function run () {
  if (!process.env.NODE_ENV && command === 'build') {
    process.env.NODE_ENV = 'production'
  }
  const opts = options()
  const log = createLogger(opts.verbose, opts.quiet)
  process.chdir(opts.dir)
  require(`./${command}`)(opts, log)
}
