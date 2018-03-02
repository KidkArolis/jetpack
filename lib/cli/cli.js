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
  .option('-v, --verbose', 'Log verbose output')

program
  .command('client [path]')
  .description('Run the client side app in dev mode')
  .action(setCommand('client'))

program
  .command('server [path]')
  .description('Run the server side app in dev mode')
  .action(setCommand('server'))

program
  .command('build [path]')
  .description('Build the app for production')
  .action(setCommand('build'))

program
  .command('start [path]')
  .description('Serve a built app in production')
  .action(setCommand('start'))

program
  .command('clean [path]')
  .description('Remove the build dir')
  .action(setCommand('clean'))

program
  .parse(process.argv)

function options () {
  return getOptions(command, program)
}

function logger () {
  const opts = options()
  return createLogger(opts.verbose)
}

function run () {
  const opts = options()
  const log = createLogger(opts.verbose)
  process.chdir(opts.dir)
  require(`./commands/${command}`)(opts, log)
}
