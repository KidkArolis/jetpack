const fs = require('fs-extra')
const path = require('path')
const requireRelative = require('require-relative')

const CONFIG_FILE = 'jetpack.config.js'

// The slightly tricky bit is how we parse the various available arguments
// to figure out which dir to run jetpack in and whether to use client, server
// or hybrid mode.
//
// The rules are:
// - if you point to a file - it will use that file as client entry point
// - if you point to a dir - it will use that dir as client entry point
// - unless the dir pointed at has client or server subdirs which case use those
module.exports = function options (command, program) {
  const cwd = process.cwd()
  const entry = typeof program.args[0] === 'string' ? program.args[0] : '.'
  const target = path.resolve(entry)
  const dir = isDir(target) ? target : cwd

  const options = Object.assign({}, readConfigFile(dir), pick(program, [
    'port',
    'jsx',
    'client',
    'server',
    'static',
    'html',
    'hot',
    'quiet',
    'verbose'
  ]))

  let client, server

  if (isDir(target)) {
    // it's a dir, check for client and server config
    if (typeof options.client === 'undefined') {
      if (isDir(path.join(dir, 'app', 'client'))) {
        client = './app/client'
      } else if (isDir(path.join(dir, 'client'))) {
        client = './client'
      } else {
        client = '.'
      }
    } else {
      client = options.client
    }

    if (typeof options.client === 'undefined') {
      if (isDir(path.join(dir, 'app', 'server'))) {
        server = './app/server'
      } else if (isDir(path.join(dir, 'server'))) {
        server = './server'
      } else {
        server = null
      }
    } else {
      server = options.server
    }
  } else {
    // it's a file, running in pure client mode
    client = entry
    server = null
  }

  const env = process.env.NODE_ENV || 'development'
  const dist = 'dist'

  return clean({
    // environment
    env,

    // command we're running
    cmd: command,

    // original working dir
    owd: cwd,

    // dir we'll be running everything in
    dir: dir,

    // relative path to client entry
    client: client,

    // check if we are in server only mode
    clientDisabled: command === 'server',

    // relative path to server entry
    server: server,

    // check if we are in client only mode
    serverDisabled: command === 'client',

    // relative path to static file dir
    static: options.static || 'static',

    // relative path to output dist dir
    dist,

    // no logs
    quiet: options.quiet,

    // more detailed logs
    verbose: options.verbose,

    // url path to bundle
    assets: env !== 'development' || command === 'start'
      ? assets(path.join(cwd, dist, 'client'))
      : ['/client/bundle.js'],

    port: options.port || 3000,
    jsx: options.jsx || jsx(dir),
    html: options.html,
    hot: options.hot,
    pkg: pkg(dir),

    browsers: options.browsers || [
      '>1%',
      'last 4 versions',
      'Firefox ESR',
      'not ie < 9' // React doesn't support IE8 anyway
    ],

    css: options.css || {
      features: {}
    },

    // webpack transform fn
    webpack: options.webpack
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

function readConfigFile (dir) {
  const configPath = path.join(dir, CONFIG_FILE)
  let exists = fs.pathExistsSync(configPath)
  return exists ? require(configPath) : {}
}

function jsx (dir) {
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

function assets (root) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')))
    return Object.keys(manifest)
      .filter(asset => asset.includes('bundle') && asset.endsWith('.js'))
      .map(asset => manifest[asset])
  } catch (err) {
    return []
  }
}

function pick (obj, attrs) {
  return attrs.reduce((acc, attr) => {
    if (typeof obj[attr] !== 'undefined') {
      acc[attr] = obj[attr]
    }
    return acc
  }, {})
}
