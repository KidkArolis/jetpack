const fs = require('fs-extra')
const path = require('path')
const requireRelative = require('require-relative')

const CONFIG_FILE = 'jetpack.config.js'

module.exports = function options (program) {
  const cwd = process.cwd()
  const target = path.resolve(program.args[0] || '.')
  const dir = isDir(target) ? target : cwd

  const config = readConfig(isDir(target) ? target : cwd)

  let client = program.client || config.client || (isDir(target) ? './client' : target)
  let server = program.server || config.server || './server'

  client = isDir(path.resolve(dir, client)) ? path.resolve(dir, client) : false
  server = isDir(path.resolve(dir, server)) ? path.resolve(dir, server) : false

  if (!client && !server) {
    client = '.'
  }

  return clean({
    owd: cwd,
    dir: dir,
    target: target,
    client: client,
    server: server,
    static: program.static || config.static || 'static',
    dist: 'dist',
    bundle: '/client/bundle.js',
    port: program.port || config.port || 3000,
    jsx: program.jsx || config.jsx || jsx(dir),
    html: program.html || config.html,
    hot: program.hot,
    pkg: pkg(dir)
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

function readConfig (dir) {
  const configPath = path.join(dir, CONFIG_FILE)
  let exists = fs.pathExistsSync(configPath)
  return exists ? require(configPath) : {}
}

function jsx (dir) {
  try {
    requireRelative.resolve('preact', dir)
    return 'Preact.h'
  } catch (err) {}
  try {
    requireRelative.resolve('react', dir)
    return 'React.createElement'
  } catch (err) {}
  return 'h'
}

function pkg (dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json')))
  } catch (err) {
    return { name: 'jetpack' }
  }
}
