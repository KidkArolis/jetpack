const program = require('commander')
const getOptions = require('./options')
const createLogger = require('./logger')
const pkg = require('../package.json')
const webpackPkg = require('webpack/package.json')

module.exports = { run, options }

let command = 'dev'
const setCommand = (name) => () => {
  command = name
}

const version = `Jetpack ${pkg.version}
Webpack ${webpackPkg.version}`

program
  .version(version, '-v, --version', 'print the version of jetpack and webpack')
  .arguments('[path]')
  .option('-p, --port <n>', 'port, defaults to 3030', Number)
  .option('-d, --dir [path]', 'run jetpack in the context of this directory')
  .option('-c, --config [path]', 'config file to use, defaults to jetpack.config.js')
  .option('-r, --no-hot', 'disable hot reloading', null)
  .option('-u, --no-minify', 'disable minification', null)
  .option('-m, --modern', 'build a modern bundle')
  .option('-l, --legacy', 'build a legacy bundle')
  .option('-x, --exec [path]', 'execute an additional process, e.g. an api server')
  .option('-i, --print-config', 'print the webpack config object used in the current command')
  .option('--log [levels]', 'select log levels: info, progress, none', 'info,progress')

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
  console.log()
  console.log('Examples:')
  console.log('  jetpack')
  console.log('  jetpack --port 3500 --log=all ./my/app')
  console.log('  jetpack build')
  console.log('  jetpack build --print-config')
  console.log('  jetpack inspect ./my/app')
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
  const log = createLogger(opts.logLevels)
  process.chdir(opts.dir)
  require(`./${command}`)(opts, log)
}
