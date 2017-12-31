const fs = require('fs')
const program = require('commander')
const requireRelative = require('require-relative')
const getConfig = require('../config')
const pkg = require('../../package.json')

let cmd = 'dev'

let client = false
let server = false

module.exports = { run, options }

program
  .version(pkg.version)
  .arguments('[path]')
  .option('-p, --port <n>', 'Port, defaults to 3000', Number)
  .option('-j, --jsx <pragma>', 'Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed')
  .option('--public <path>', 'Public directory from which static assets will be served by the dev server')
  // think of smth better, smth js dynamic, async and templated, e.g. to enable SSR json
  .option('--html <path>', 'Path to html file that will be rendered by the dev server')
  .option('--no-hot', 'Disable hot reloading')

program
  .command('build [path]')
  .description('Build the app for production')
  .action(function (dir) {
    cmd = 'build'
  })

program
  .command('start [path]')
  .description('Serve a built app in production')
  .action(function () {
    cmd = 'start'
  })

program.parse(process.argv)

// TODO - should the side effects be moved to bin/jetpack.js?
// the dir arg is a directory, switch to if before anything else
const target = program.args[0]

if (target && isDir(target)) {
  process.chdir(target)
}

if (target && !isDir(target)) {
  client = target
}

const config = getConfig()
client = isDir(config.client) ? config.client : '.'
server = isDir(config.server) ? config.server : false

// run a cli command based on args
function run () {
  const opt = options()
  const cmd = opt.cmd
  require(`./${cmd}`)(opt)
}

// parse the cli args
function options () {
  // get pkg meta
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync('./package.json'))
  } catch (err) {
    pkg = { name: 'jetpack' }
  }

  // detect how to compile jsx
  let jsx = 'h'
  try {
    requireRelative.resolve('preact', process.cwd())
    jsx = 'Preact.h'
  } catch (err) {}
  try {
    requireRelative.resolve('react', process.cwd())
    jsx = 'React.createElement'
  } catch (err) {}

  return clean({
    cwd: process.cwd(),
    cmd: cmd,
    hot: program.hot,
    client: client,
    server: server,
    port: program.port || config.port,
    jsx: program.jsx || config.jsx || jsx,
    html: program.html || config.html,
    public: program.public || config.public,
    bundle: '/client/bundle.js',
    dist: 'dist',
    pkg: pkg
  })
}

function clean (obj) {
  return Object.keys(obj).reduce(function (memo, k) {
    if (obj[k] === undefined) return memo
    memo[k] = obj[k]
    return memo
  }, {})
}

function isDir (path) {
  try {
    return fs.lstatSync(path).isDirectory(path)
  } catch (err) {
    return false
  }
}
