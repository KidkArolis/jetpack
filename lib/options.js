const fs = require('fs-extra')
const path = require('path')
const requireRelative = require('require-relative')

const CONFIG_FILE = 'jetpack.config.js'

module.exports = function options (command = 'dev', program = {}) {
  const dir = program.dir ? path.resolve(program.dir) : process.cwd()
  let entry = program.args && typeof program.args[0] === 'string' ? program.args[0] : null
  const production = command === 'build' || command === 'inspect'

  // set this so that the config file could correctly
  // determine if we're in production mode
  if (production && !process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'
  }

  const configFromFile = readConfigFromFile(dir, program.config || CONFIG_FILE)
  const options = Object.assign({}, configFromFile, pick(program, [
    'port',
    'dir',
    'exec',
    'jsx',
    'hot',
    'config',
    'minify',
    'quiet',
    'verbose'
  ]))

  // if specified in config file
  if (!entry) {
    entry = options.entry
  }

  if (!entry) {
    entry = first([
      // default – node style
      '.',
      // for webpack compatibility
      './src'
    ], ifModuleExists(dir))
  }

  // if nothing is found, default to '.' in case
  // the entry module is created after jetpack starts
  if (!entry) {
    entry = '.'
  }

  // when tabing in the terminal to autocomplete paths
  // the beginning of the path doesn't start with ./
  // and webpack tries to resolve it as a node module
  // always prefix the entry with ./ unless it's an absolute path
  if (entry !== '.' && !entry.startsWith('/') && !entry.startsWith('./')) {
    entry = './' + entry
  }

  const dist = options.dist || 'dist'

  const target = program.legacy || program.modern
    ? { modern: !!program.modern, legacy: !!program.legacy }
    : options.target || { modern: true, legacy: false }

  return clean({
    // build mode
    production,

    // directory to run jetpack in
    dir: dir,

    // entry module path relative to dir
    entry,

    // port of the dev server
    port: options.port === undefined ? 3030 : options.port,

    // relative path to static assets file dir
    static: options.static || 'assets',

    // relative path to output dist dir
    dist,

    // jsx pragma
    jsx: options.jsx || jsx(dir),

    // hot reloading
    hot: options.hot === undefined ? true : options.hot,

    // unified flag for source maps for js and css
    sourceMaps: options.sourceMaps === undefined
      ? production ? undefined : 'source-map'
      : options.sourceMaps === true ? 'source-map' : options.sourceMaps,

    // to turn off minification in production
    minify: options.minify === undefined ? true : options.minify,

    target,

    // command executed to run the server/api process
    exec: program.exec
      ? first([
        program.exec,
        configFromFile.exec,
        'node .'
      ], ifString)
      : false,

    // used for proxying certain requests to a different server
    // can be an object or a function
    proxy: options.proxy || {},

    // no logs
    quiet: options.quiet,

    // more detailed logs
    verbose: options.verbose,

    // url paths to all of the build output files
    // of shape { js: string[], css: string[], other: string[], runtime: string }
    assets: assets({
      root: path.join(dir, dist, 'assets'),
      modern: target.modern,
      production
    }),

    // the index.html template generation
    title: options.title || pkg(dir).name || 'jetpack',

    // useful for meta tags and scripts
    head: options.head || null,

    // body
    body: options.body || `<div id='root'></div>`,

    // the html template
    html: options.html || fs.readFileSync(path.join(__dirname, 'template.hbs')).toString(),

    css: Object.assign({

      // css modules
      modules: false,

      // a shortcut for setting postcss-preset-env features
      features: {}

    }, options.css),

    // for browsers command
    coverage: program.args && program.args.length && program.args[0].coverage !== undefined ? program.args[0].coverage : false,

    // webpack transform fn
    webpack: options.webpack,

    printConfig: program.printConfig
  })
}

module.exports.recomputeAssets = function recomputeAssets (options, { modern }) {
  return Object.assign({}, options, {
    assets: assets({
      root: path.join(options.dir, options.dist, 'assets'),
      production: options.production,
      modern
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
  const exists = fs.pathExistsSync(configPath)
  return exists ? require(configPath) : {}
}

function pkg (dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json')))
  } catch (err) {
    return {}
  }
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

function assets ({ root, production, modern }) {
  if (!production) {
    return { js: [modern ? '/assets/bundle.js' : '/assets/bundle.legacy.js'], css: [], other: [], runtime: null }
  }

  const js = []
  const css = []
  const other = []
  let runtime = null

  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, modern ? 'manifest.json' : 'manifest.legacy.json')))
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { js, css, other, runtime }
    }
    throw err
  }

  Object.keys(manifest).forEach(asset => {
    if (asset.endsWith('.js') && asset.startsWith('runtime~')) {
      other.push(manifest[asset])
      runtime = String(fs.readFileSync(path.join(root, '..', '.' + manifest[asset])))
      // Since we inline the runtime at the root index html, correct the sourceMappingURL
      runtime = runtime.replace('//# sourceMappingURL=', '//# sourceMappingURL=assets/')
    } else if (/^(bundle|vendor)[.~]?.*\.(js|css)$/.test(asset)) {
      if (asset.endsWith('.js')) {
        js.push(manifest[asset])
      } else {
        css.push(manifest[asset])
      }
    } else {
      other.push(manifest[asset])
    }
  })

  return { js, css, other, runtime }
}

function pick (obj, attrs) {
  return attrs.reduce((acc, attr) => {
    if (obj[attr] !== undefined) {
      acc[attr] = obj[attr]
    }
    return acc
  }, {})
}

function first (values, condition) {
  for (const val of values) {
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
