const fs = require('fs-extra')
const path = require('path')
const requireRelative = require('require-relative')

const CONFIG_FILE = 'jetpack.config.js'

// In terms of where you point your jetpack at:
// - if you point to a file – use that file as client entry point, use cwd as context dir
// - if you point to a dir – it will use that dir as client entry point, use that dir as context dir
// - however if the target dir has app/client or client dir, use that, use cwd as context dir
// does this need simplifying in some way? we also have --client arg and --server arg in addition to [path] arg..?
// consider renaming client -> entry
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

  let client

  if (isDir(target)) {
    if (typeof options.server === 'undefined') {
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

    // it's a dir, check for client and server config
    if (typeof options.client === 'undefined') {
      if (isDir(path.join(dir, 'app', 'client'))) {
        client = './app/client'
      } else if (isDir(path.join(dir, 'client'))) {
        client = './client'
      } else {
        client = server ? null : '.'
      }
    } else {
      client = options.client
    }
  } else {
    // it's a file, running in pure client mode
    client = entry
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

    // command executed to run the server/api process
    server: options.server === true ? 'npm start' : options.server,

    // relative path to static file dir
    static: options.static || 'static',

    // relative path to output dist dir
    dist,

    // no logs
    quiet: options.quiet,

    // more detailed logs
    verbose: options.verbose,

    // url path to bundle
    assets: env === 'development'
      ? ['/client/bundle.js']
      : assets(path.join(cwd, dist, 'client')),

    port: options.port || 3030,
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
