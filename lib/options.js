import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SUPPORTED_CONFIG_FILES = ['jetpack.config.js', 'jetpack.config.mjs', 'jetpack.config.cjs']

export default resolveOptions

export async function resolveOptions({
  command = 'dev',
  dir = process.cwd(),
  entry = null,
  config,
  overrides = {}
} = {}) {
  dir = path.resolve(dir)
  const production = command === 'build' || command === 'inspect'
  const mode = production ? 'production' : 'development'
  const configPath = config || SUPPORTED_CONFIG_FILES.find((file) => existsSync(path.join(dir, file)))

  const configFromFile = await readConfigFromFile(dir, configPath)
  const options = Object.assign({}, configFromFile, pick(overrides, ['port', 'host', 'hot', 'minify', 'log']))

  // if specified in config file
  if (!entry) {
    entry = options.entry
  }

  // default to '.' — rspack resolves it via package.json main / index.js
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

  const dist = validateDist(options.dist || 'dist', { dir })
  const assetBaseUrl = withTrailingSlash(options.assetBaseUrl || '/assets/')
  const target = resolveTarget(overrides.target ?? options.target ?? { modern: true, legacy: false }, { command })

  return clean({
    command,

    mode,

    // build mode
    production,

    // directory to run jetpack in
    dir,

    // entry module path relative to dir
    entry,

    // port of the dev server
    port: options.port === undefined ? 3030 : options.port,

    // host of the dev server
    host: options.host || 'localhost',

    // relative path to output dist dir
    dist,

    assetBaseUrl,

    // The URL pathname portion of `assetBaseUrl`, normalised with a trailing
    // slash. Used by the dev server to mount middlewares at the right
    // location. Works whether assetBaseUrl is a path (`/assets/`) or a full
    // URL (`https://cdn.example.com/bundles/`).
    assetBasePathname: pathnameWithTrailingSlash(assetBaseUrl),

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

    // build-time constants passed to rspack.DefinePlugin
    define: options.define || {},

    target,

    printConfig: overrides.printConfig,

    yes: overrides.yes,

    dryRun: overrides.dryRun,

    // used for proxying certain requests to a different server
    // can be an object or a function
    proxy: options.proxy || {},

    // log levels to output
    logLevels: parseLogLevels(options.log),

    // the index.html template generation
    title: options.title || pkg(dir).name || 'jetpack',

    // add a per-request CSP nonce placeholder to jetpack-owned scripts
    cspNonce: options.cspNonce || false,

    // custom index.html renderer
    html: options.html || null,

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
    coverage: overrides.coverage || false,

    // rspack config transform fn
    rspack: options.rspack
  })
}

function clean(obj) {
  return Object.keys(obj).reduce(function (memo, k) {
    if (obj[k] === undefined) return memo
    memo[k] = obj[k]
    return memo
  }, {})
}

async function readConfigFromFile(dir, configFilePath) {
  if (!configFilePath) return {}
  const configPath = path.join(dir, configFilePath)
  if (!existsSync(configPath)) return {}
  const mod = await import(pathToFileURL(configPath).href)
  return mod.default ? mod.default : mod
}

function pkg(dir) {
  try {
    return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
  } catch {
    return {}
  }
}

function isUsingReact(dir) {
  try {
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    return !!(pkg.dependencies?.react || pkg.devDependencies?.react)
  } catch {
    return false
  }
}

function pick(obj, attrs) {
  return attrs.reduce((acc, attr) => {
    if (obj[attr] !== undefined) {
      acc[attr] = obj[attr]
    }
    return acc
  }, {})
}

function parseLogLevels(input) {
  const levels = (input || '').split(',').map((l) => l.trim())
  if (levels.includes('all')) {
    return { info: true, progress: true, none: false }
  }
  if (levels.includes('silent') || levels.includes('none')) {
    return { info: false, progress: false, none: true }
  }

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

function pathnameWithTrailingSlash(url) {
  const pathname = new URL(url, 'http://localhost').pathname
  return pathname.endsWith('/') ? pathname : pathname + '/'
}

function withTrailingSlash(url) {
  return url.endsWith('/') ? url : url + '/'
}

function resolveTarget(input, { command }) {
  let target
  if (typeof input === 'string') {
    if (input === 'modern') {
      target = { modern: true, legacy: false }
    } else if (input === 'legacy') {
      target = { modern: false, legacy: true }
    } else if (input === 'all') {
      target = { modern: true, legacy: true }
    } else {
      throw new Error(`Invalid target "${input}". Expected modern, legacy, or all.`)
    }
  } else {
    target = input
  }

  if (!target?.modern && !target?.legacy) {
    throw new Error('At least one build target must be enabled.')
  }

  if ((command === 'dev' || command === 'inspect') && target.modern && target.legacy) {
    throw new Error(`Command "${command}" only supports one target at a time. Use --target modern or --target legacy.`)
  }

  return target
}

function validateDist(dist, { dir }) {
  if (typeof dist !== 'string' || dist.trim() === '') {
    throw new Error('dist must be a non-empty relative path.')
  }
  if (path.isAbsolute(dist)) {
    throw new Error('dist must be relative to the project root.')
  }

  const outputPath = path.resolve(dir, dist)
  const relativeOutputPath = path.relative(dir, outputPath)
  if (relativeOutputPath === '') {
    throw new Error('dist must not point to the project root.')
  }
  if (relativeOutputPath.startsWith('..') || path.isAbsolute(relativeOutputPath)) {
    throw new Error('dist must stay inside the project root.')
  }

  return dist
}
