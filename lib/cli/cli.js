const program = require('commander')
const getOptions = require('./options')
const createLogger = require('../logger')
const pkg = require('../../package.json')

module.exports = { run, options, logger }

let command = 'dev'
let setCommand = name => () => { command = name }

program
  .version(pkg.version)
  .arguments('[path]')
  .option('-p, --port <n>', 'Port, defaults to 3000', Number)
  .option('-j, --jsx <pragma>', 'Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed')
  .option('--static <path>', 'Directory from which static assets will be served by the server')
  .option('--html <path>', 'Path to html file that will be rendered by the server')
  .option('--no-hot', 'Disable hot reloading')
  .option('-q, --quiet', 'Log verbose output')
  .option('-v, --verbose', 'Log verbose output')

program
  .command('client')
  .description('Run the client side app in dev mode')
  .action(setCommand('client'))

program
  .command('server')
  .description('Run the server side app in dev mode')
  .action(setCommand('server'))

program
  .command('build')
  .description('Build the app for production')
  .action(setCommand('build'))

program
  .command('start')
  .description('Serve a built app in production')
  .action(setCommand('start'))

program
  .command('inspect')
  .description('Generate dependency report')
  .action(setCommand('inspect'))

program
  .command('clean')
  .description('Remove the build dir')
  .action(setCommand('clean'))

program.on('--help', function (here) {
  const webpackPkg = require('webpack/package.json')
  const nodemonPkg = require('nodemon/package.json')
  console.log()
  console.log()
  console.log('  Examples:')
  console.log()
  console.log('    $ jetpack')
  console.log('    $ jetpack inspect ./my/app')
  console.log('    $ jetpack --port 3500 --verbose ./my/app')
  console.log()
  console.log()
  console.log('  Versions:')
  console.log()
  console.log(`    Jetpack ${pkg.version}`)
  console.log(`    Webpack ${webpackPkg.version}`)
  console.log(`    Nodemon ${nodemonPkg.version}`)
  console.log()
})

if (process.env.JETPACK_ARGS) {
  program.parse(process.argv.slice(0, 2).concat(process.env.JETPACK_ARGS.split(' ')))
} else {
  program.parse(process.argv)
}

function options () {
  return getOptions(command, program)
}

function logger () {
  const opts = options()
  return createLogger(opts.verbose, opts.quiet)
}

function run () {
  const opts = options()
  const log = createLogger(opts.verbose, opts.quiet)
  process.chdir(opts.dir)
  require(`./commands/${command}`)(opts, log)
}
