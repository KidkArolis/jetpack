const program = require('commander')
const getOptions = require('./options')
const pkg = require('../../package.json')

module.exports = { run, options }

let command = 'dev'
let setCommand = name => () => { command = name }

program
  .version(pkg.version)
  .arguments('[path]')
  .option('-p, --port <n>', 'Port, defaults to 3000', Number)
  .option('-j, --jsx <pragma>', 'Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed')
  .option('--static <path>', 'Directory from which static assets will be served by the server')
  // TODO think of smth better, smth js dynamic, async and templated, e.g. to enable SSR json
  .option('--html <path>', 'Path to html file that will be rendered by the server')
  .option('--no-hot', 'Disable hot reloading')

program
  .command('build [path]')
  .description('Build the app for production')
  .action(setCommand('build'))

program
  .command('clean [path]')
  .description('Remove the build dir')
  .action(setCommand('clean'))

program
  .command('start [path]')
  .description('Serve a built app in production')
  .action(setCommand('start'))

program
  .parse(process.argv)

function options () {
  return getOptions(command, program)
}

function run () {
  const opts = options()
  process.chdir(opts.dir)
  require(`./commands/${command}`)(opts)
}
