const { existsSync, readFileSync } = require('fs')
const path = require('path')

const SUPPORTED_CONFIG_FILES = ['jetpack.config.js', 'jetpack.config.cjs']

module.exports = function options(command = 'dev', { entry = null, flags = {} } = {}) {
  const dir = flags.dir ? path.resolve(flags.dir) : process.cwd()
  const production = command === 'build' || command === 'inspect'

  // set this so that the config file could correctly
  // determine if we're in production mode
  if (production && !process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'
  }

  const configPath = flags.config || SUPPORTED_CONFIG_FILES.find((file) => existsSync(path.join(dir, file)))

  const configFromFile = readConfigFromFile(dir, configPath)
  const options = Object.assign(
    {},
    configFromFile,
    pick(flags, ['port', 'dir', 'exec', 'hot', 'config', 'minify', 'log'])
  )

  // if specified in config file
  if (!entry) {
    entry = options.entry
  }

  if (!entry) {
    entry = first(
      [
        // default – node style
        '.',
        // for rspack compatibility
        './src'
      ],
      ifModuleExists(dir)
    )
  }

  // if nothing is found, default to '.' in case
  // the entry module is created after jetpack starts
  if (!entry) {
    entry = '.'
  }

  // when tabing in the terminal to autocomplete paths
  // the beginning of the path doesn't start with ./
  // and rspack tries to resolve it as a node module
  // always prefix the entry with ./ unless it's an absolute path
  if (entry !== '.' && !entry.startsWith('/') && !entry.startsWith('./')) {
    entry = './' + entry
  }

  const dist = options.dist || 'dist'
  const publicPath = options.publicPath || '/assets/'

  const target =
    flags.legacy || flags.modern
      ? { modern: !!flags.modern, legacy: !!flags.legacy }
      : options.target || { modern: true, legacy: false }

  return clean({
    // build mode
    production,

    // directory to run jetpack in
    dir,

    // entry module path relative to dir
    entry,

    // port of the dev server
    port: options.port === undefined ? 3030 : options.port,

    // relative path to static assets file dir
    static: options.static || 'assets',

    // relative path to output dist dir
    dist,

    publicPath,

    // are we using react
    react: options.react || isUsingReact(dir),

    // hot reloading
    hot: parseHot(options.hot),

    // unified flag for source maps for js and css
    sourceMaps:
      options.sourceMaps === undefined
        ? production
          ? undefined
          : 'source-map'
        : options.sourceMaps === true
          ? 'source-map'
          : options.sourceMaps,

    // to turn off minification in production
    minify: options.minify === undefined ? true : options.minify,

    // retry loading chunks
    chunkLoadRetry: options.chunkLoadRetry ?? false,

    target,

    // command executed to run the server/api process
    exec: flags.exec ? first([flags.exec, configFromFile.exec, 'node .'], ifString) : false,

    printConfig: flags.printConfig,

    // used for proxying certain requests to a different server
    // can be an object or a function
    proxy: options.proxy || {},

    // log levels to output
    logLevels: parseLogLevels(options.log),

    // url paths to all of the entrypoints files to be embedded into the html
    assets: {
      js: [target.modern ? '/assets/bundle.js' : '/assets/bundle.legacy.js'],
      css: [],
      runtime: [],
      other: []
    },

    // the runtime code to be embedded into the html
    runtime: null,

    // the index.html template generation
    title: options.title || pkg(dir).name || 'jetpack',

    // useful for meta tags and scripts
    head: options.head || null,

    // body
    body: options.body || "<div id='root'></div>",

    // the html template
    html: options.html || readFileSync(path.join(__dirname, 'template.hbs')).toString(),

    css: Object.assign(
      {
        // css modules
        modules: false,

        // a shortcut for setting lightningcss-loader features
        features: {
          include: null,
          exclude: null
        }
      },
      options.css
    ),

    // for browsers command
    coverage: flags.coverage || false,

    // rspack config transform fn
    rspack: options.rspack || options.webpack
  })
}

module.exports.recomputeAssets = function recomputeAssets(options, stats) {
  const { outputPath, publicPath, entrypoints } = stats
  return Object.assign({}, options, {
    assets: assets({ outputPath, publicPath, entrypoints }),
    runtime: runtime({ outputPath, publicPath, entrypoints })
  })
}

function clean(obj) {
  return Object.keys(obj).reduce(function (memo, k) {
    if (obj[k] === undefined) return memo
    memo[k] = obj[k]
    return memo
  }, {})
}

function readConfigFromFile(dir, configFilePath) {
  if (!configFilePath) return {}
  const configPath = path.join(dir, configFilePath)
  const exists = existsSync(configPath)
  const config = exists ? require(configPath) : {}
  return config.default ? config.default : config
}

function pkg(dir) {
  try {
    return JSON.parse(readFileSync(path.join(dir, 'package.json')))
  } catch (err) {
    return {}
  }
}

function isUsingReact(dir) {
  try {
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    return (pkg.dependencies && pkg.dependencies.react) || (pkg.devDependencies && pkg.devDependencies.react)
  } catch (err) {
    return false
  }
}

function assets({ publicPath, entrypoints }) {
  const js = []
  const css = []
  const other = []
  const runtime = []

  // process all of the entrypoints into a format
  // that is easy to embed into the template
  // where we inline the runtime, outpu css as link tags
  // and js as script tags
  entrypoints.bundle.assets.forEach(({ name: asset }) => {
    const assetPath = publicPath + asset
    if (asset.startsWith('runtime~bundle') && asset.endsWith('.js')) {
      runtime.push(assetPath)
    } else if (asset.endsWith('.js')) {
      js.push(assetPath)
    } else if (asset.endsWith('.css')) {
      css.push(assetPath)
    } else {
      other.push(assetPath)
    }
  })

  return { js, css, runtime, other }
}

function runtime({ outputPath, publicPath, entrypoints }) {
  let runtime = null

  if (entrypoints && entrypoints.bundle) {
    const runtimeAsset = entrypoints.bundle.assets.find((a) => a.name.startsWith(`runtime~bundle.`))
    if (runtimeAsset) {
      try {
        runtime = String(readFileSync(path.join(outputPath, runtimeAsset.name)))
        // Since we inline the runtime at the root index html, correct the sourceMappingURL
        return runtime.replace('//# sourceMappingURL=', `//# sourceMappingURL=${publicPath}`)
      } catch (err) {
        return null
      }
    }
  }

  return null
}

function pick(obj, attrs) {
  return attrs.reduce((acc, attr) => {
    if (obj[attr] !== undefined) {
      acc[attr] = obj[attr]
    }
    return acc
  }, {})
}

function first(values, condition) {
  for (const val of values) {
    if (condition(val)) {
      return val
    }
  }
}

function ifModuleExists(dir) {
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

function ifString(str) {
  if (typeof str === 'string') {
    return str
  } else {
    return false
  }
}

function parseLogLevels(input) {
  const levels = (input || '').split(',').map((l) => l.trim())
  const result = {}
  for (const level of ['info', 'progress', 'none']) {
    result[level] = levels.includes(level)
  }
  return result
}

function parseHot(input) {
  if (typeof input === 'object' && input !== null) {
    return {
      enabled: input.enabled !== false,
      quiet: input.quiet === true
    }
  }
  return {
    enabled: input !== false,
    quiet: false
  }
}
