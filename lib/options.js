const fs = require('fs-extra')
const path = require('path')
const requireRelative = require('require-relative')

const CONFIG_FILE = 'jetpack.config.js'

module.exports = function options (command, program) {
  const dir = program.dir ? path.resolve(program.dir) : process.cwd()
  let entry = typeof program.args[0] === 'string' ? program.args[0] : null

  const configFromFile = readConfigFromFile(dir, program.config || CONFIG_FILE)
  const options = Object.assign({}, configFromFile, pick(program, [
    'port',
    'dir',
    'exec',
    'jsx',
    'hot',
    'config',
    'quiet',
    'verbose',
    'verbose'
  ]))

  // if specified in config file
  if (!entry) {
    entry = options.entry
  }

  if (!entry) {
    // Bad magic?
    entry = first([
      // default – node style
      '.',
      // for when keeping src in app
      './app',
      // for webpack compatibility
      './src'
    ], ifModuleExists(dir))
  }

  if (!entry) {
    entry = '.'
  }

  const dist = 'dist'
  const pkg = getPkg(dir)
  const production = command === 'build' || command === 'inspect'

  return clean({
    // package.json
    pkg,

    // build mode
    production,

    // command we're running
    cmd: command,

    // dir we'll be running everything in
    dir: dir,

    // relative path to entry module
    entry,

    // port of the dev server
    port: typeof options.port === 'undefined' ? 3030 : options.port,

    // relative path to static assets file dir
    static: options.static || 'assets',

    // relative path to output dist dir
    dist,

    // jsx pragma
    jsx: options.jsx || jsx(dir),

    // hot reloading
    hot: options.hot,

    // unified flag for source maps for js and css
    sourceMaps: typeof options.sourceMaps === 'undefined'
      ? production ? undefined : 'source-map'
      : options.sourceMaps === true ? 'source-map' : options.sourceMaps,

    // command executed to run the server/api process
    exec: program.exec
      ? first([
        program.exec,
        configFromFile.exec,
        'node .'
      ], ifString)
      : false,

    // used for proxying certain requests to a different server
    proxy: options.proxy || {},

    // no logs
    quiet: options.quiet,

    // more detailed logs
    verbose: options.verbose,

    // url paths to all of the build output files
    // of shape { js: string[], css: string[], other: string[], runtime: string }
    assets: assets({
      root: path.join(dir, dist, 'assets'),
      production
    }),

    // the index.html template generation
    title: pkg.name,
    head: options.head || null,
    body: options.body || `<div id='root'></div>`,
    html: options.html || fs.readFileSync(path.join(__dirname, 'template.ejs')).toString(),

    minify: typeof options.minify === 'undefined' ? true : options.minify,

    css: Object.assign({
      modules: false,
      features: {}
    }, options.css),

    // webpack transform fn
    webpack: options.webpack
  })
}

module.exports.recomputeAssets = function recomputeAssets (options) {
  return Object.assign({}, options, {
    assets: assets({
      root: path.join(options.dir, options.dist, 'assets'),
      production: options.production
    })
  })
}

function clean (obj) {
  return Object.keys(obj).reduce(function (memo, k) {
    if (obj[k] === undefined) return memo
    memo[k] = obj[k]
    return memo
  }, {})
}

function readConfigFromFile (dir, configFilePath) {
  const configPath = path.join(dir, configFilePath)
  let exists = fs.pathExistsSync(configPath)
  return exists ? require(configPath) : {}
}

function jsx (dir) {
  try {
    requireRelative.resolve('react', dir)
    return 'React.createElement'
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
  return 'h'
}

function getPkg (dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json')))
  } catch (err) {
    return { name: 'jetpack' }
  }
}

function assets ({ root, production }) {
  if (!production) {
    return { js: ['/assets/bundle.js'], css: [], other: [], runtime: null }
  }

  const js = []
  const css = []
  const other = []
  let runtime = null

  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')))
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { js, css, other, runtime }
    }
    throw err
  }

  Object.keys(manifest).forEach(asset => {
    if (asset.endsWith('.js') && asset.startsWith('runtime~')) {
      runtime = String(fs.readFileSync(path.join(root, '..', '.' + manifest[asset])))
    } else if (asset.endsWith('.js') && !asset.endsWith('.chunk.js')) {
      js.push(manifest[asset])
    } else if (asset.endsWith('.css') && !asset.endsWith('.chunk.css')) {
      css.push(manifest[asset])
    } else {
      other.push(manifest[asset])
    }
  })

  return { js, css, other, runtime }
}

function pick (obj, attrs) {
  return attrs.reduce((acc, attr) => {
    if (typeof obj[attr] !== 'undefined') {
      acc[attr] = obj[attr]
    }
    return acc
  }, {})
}

function first (values, condition) {
  for (let val of values) {
    if (condition(val)) {
      return val
    }
  }
}

function ifModuleExists (dir) {
  return function (mod) {
    if (!mod) {
      return false
    }

    try {
      require.resolve(path.join(dir, mod))
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        return false
      }
      throw err
    }
    return mod
  }
}

function ifString (str) {
  if (typeof str === 'string') {
    return str
  } else {
    return false
  }
}
