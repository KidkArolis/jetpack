const { parseArgs } = require('node:util')
const getOptions = require('./options')
const createLogger = require('./logger')
const pkg = require('../package.json')
const rspackPkg = require('@rspack/core/package.json')

module.exports = { run, options }

const commands = ['dev', 'build', 'inspect', 'browsers', 'clean']

const config = {
  options: {
    // Boolean flags
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    hot: { type: 'boolean' },
    minify: { type: 'boolean' },
    modern: { type: 'boolean', short: 'm' },
    legacy: { type: 'boolean', short: 'l' },
    'print-config': { type: 'boolean', short: 'i' },

    // String options
    port: { type: 'string', short: 'p' },
    dir: { type: 'string', short: 'd' },
    config: { type: 'string', short: 'c' },
    exec: { type: 'string', short: 'x' },
    log: { type: 'string', short: 'o', default: 'info,progress' },
    coverage: { type: 'string' }
  },
  allowPositionals: true
}

// Parse arguments
const { values: flags, positionals } = parseArgs(config)

// Handle --version
if (flags.version) {
  console.log(`Jetpack ${pkg.version}\nRspack ${rspackPkg.version}`)
  process.exit(0)
}

// Handle --help
if (flags.help) {
  printHelp()
  process.exit(0)
}

// Determine command (default to 'dev')
let command = 'dev'
if (positionals.length > 0 && commands.includes(positionals[0])) {
  command = positionals.shift()
}

// Handle negated flags
if (process.argv.includes('--no-hot')) {
  flags.hot = false
}
if (process.argv.includes('--no-minify')) {
  flags.minify = false
}

// handle dashed flags
if (flags['print-config']) {
  flags.printConfig = flags['print-config']
}

// Add path from positionals if present
let entry
if (positionals.length > 0) {
  entry = positionals[0]
}

function printHelp() {
  console.log(`
Usage: jetpack [command] [options] [path]

Commands:
  dev       run the dev server (default)
  build     build for production
  inspect   analyze bundle
  browsers  print supported browsers
  clean     remove the dist dir

Options:
  -p, --port <n>       port, defaults to 3030
  -d, --dir [path]     run jetpack in the context of this directory
  -c, --config [path]  config file to use, defaults to jetpack.config.js
  -r, --no-hot         disable hot reloading
  -u, --no-minify      disable minification
  -m, --modern         build a modern bundle
  -l, --legacy         build a legacy bundle
  -x, --exec [path]    execute an additional process, e.g. an api server
  -i, --print-config   print the rspack config object used in the current command
  -o, --log [levels]   select log levels: info, progress, none
  -v, --version        print the version of jetpack and rspack
  -h, --help           display help for command

Options for browsers command:
  --coverage [country] display coverage for specific country, e.g. --coverage=US

Examples:
  jetpack
  jetpack --port 3500 --log=all ./my/app
  jetpack build
  jetpack build --print-config
  jetpack inspect ./my/app
  jetpack browsers --coverage=US
  jetpack --exec
  jetpack --exec 'nodemon ./server.js'

Versions:
  Jetpack ${pkg.version}
  Rspack ${rspackPkg.version}
`)
}

function options() {
  return getOptions(command, { entry, flags, positionals })
}

function run() {
  const opts = options()
  const log = createLogger(opts.logLevels)
  process.chdir(opts.dir)
  require(`./${command}`)(opts, log)
}
