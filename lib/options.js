import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SUPPORTED_CONFIG_FILES = ['jetpack.config.js', 'jetpack.config.mjs', 'jetpack.config.cjs']

export default resolveOptions

const TARGETS = ['modern', 'legacy', 'all']

export async function resolveOptions({
  command = 'dev',
  mode = defaultMode(command),
  dir = process.cwd(),
  entry = null,
  config,
  overrides = {}
} = {}) {
  dir = path.resolve(dir)
  mode = validateMode(mode)
  const configPath = config || SUPPORTED_CONFIG_FILES.find((file) => existsSync(path.join(dir, file)))

  const configFromFile = await readConfigFromFile(dir, configPath)
  validateMovedConfigOptions(configFromFile)
  const options = Object.assign(
    {},
    configFromFile,
    pick(overrides, ['port', 'host', 'hot', 'log', 'transpileDependencies'])
  )

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

  const build = normalizeBuild(options.build, { mode, overrides })
  const html = normalizeHtml(options.html, { dir })
  build.outDir = validateOutDir(build.outDir, { dir })
  const assetBaseUrl = withTrailingSlash(options.assetBaseUrl || '/assets/')
  const target = resolveTarget(overrides.target ?? options.target ?? 'modern', { command })
  const css = normalizeCss(options.css)
  const assets = normalizeAssets(options.assets)
  const transpileDependencies = normalizeTranspileDependencies(options.transpileDependencies)

  return clean({
    command,

    mode,

    // directory to run jetpack in
    dir,

    // entry module path relative to dir
    entry,

    // port of the dev server
    port: options.port === undefined ? 3030 : options.port,

    // host of the dev server
    host: options.host || 'localhost',

    build,

    assetBaseUrl,

    // The URL pathname portion of `assetBaseUrl`, normalised with a trailing
    // slash. Used by the dev server to mount middlewares at the right
    // location. Works whether assetBaseUrl is a path (`/assets/`) or a full
    // URL (`https://cdn.example.com/bundles/`).
    assetBasePathname: pathnameWithTrailingSlash(assetBaseUrl),

    // hot reloading
    hot: parseHot(options.hot),

    // build-time constants passed to rspack.DefinePlugin
    define: options.define || {},

    target,

    // used for proxying certain requests to a different server
    // can be an object or a function
    proxy: options.proxy || {},

    // log levels to output
    logLevels: parseLogLevels(options.log),

    html,

    css,

    assets,

    transpileDependencies,

    // rspack config transform fn
    rspack: options.rspack
  })
}

function defaultMode(command) {
  return command === 'build' || command === 'inspect' ? 'production' : 'development'
}

function validateMode(mode) {
  if (mode !== 'development' && mode !== 'production') {
    throw new Error(`Invalid mode "${mode}". Expected development or production.`)
  }
  return mode
}

function validateMovedConfigOptions(config) {
  const movedOptions = {
    outDir: 'build.outDir',
    sourceMaps: 'build.sourceMaps',
    minify: 'build.minify',
    chunkLoadRetry: 'build.chunkLoadRetry',
    title: 'html.title',
    cspNonce: 'html.cspNonce'
  }

  for (const [from, to] of Object.entries(movedOptions)) {
    if (config[from] !== undefined) {
      throw new Error(`${from} moved to ${to}.`)
    }
  }
}

function normalizeBuild(input, { mode, overrides }) {
  if (input !== undefined && (typeof input !== 'object' || input === null || Array.isArray(input))) {
    throw new Error('build must be an object.')
  }

  const build = Object.assign(
    {
      outDir: 'dist',
      sourceMaps: undefined,
      minify: true,
      chunkLoadRetry: false
    },
    input
  )

  if (overrides.minify !== undefined) {
    build.minify = overrides.minify
  }

  build.sourceMaps =
    build.sourceMaps === undefined
      ? mode === 'production'
        ? undefined
        : 'source-map'
      : build.sourceMaps === true
        ? 'source-map'
        : build.sourceMaps

  return build
}

function normalizeHtml(input, { dir }) {
  if (input !== undefined && (typeof input !== 'object' || input === null || Array.isArray(input))) {
    throw new Error('html must be an object. Use html.render for custom HTML.')
  }

  const options = Object.assign(
    {
      title: pkg(dir).name || 'jetpack',
      cspNonce: false,
      render: null
    },
    input
  )

  return options
}

function normalizeCss(input) {
  const css = Object.assign(
    {
      // css modules
      modules: false
    },
    input
  )

  if (
    css.modules !== false &&
    css.modules !== true &&
    (typeof css.modules !== 'object' || css.modules === null || Array.isArray(css.modules))
  ) {
    throw new Error('css.modules must be false, true, or an object.')
  }
  if (
    typeof css.modules === 'object' &&
    css.modules !== null &&
    css.modules.conventional !== undefined &&
    typeof css.modules.conventional !== 'boolean'
  ) {
    throw new Error('css.modules.conventional must be a boolean.')
  }

  return css
}

function normalizeAssets(input) {
  if (input !== undefined && (typeof input !== 'object' || input === null || Array.isArray(input))) {
    throw new Error('assets must be an object.')
  }

  const assets = Object.assign(
    {
      inlineLimit: 8096
    },
    input
  )

  if (
    typeof assets.inlineLimit !== 'number' ||
    !Number.isFinite(assets.inlineLimit) ||
    assets.inlineLimit < 0 ||
    !Number.isInteger(assets.inlineLimit)
  ) {
    throw new Error('assets.inlineLimit must be a non-negative integer.')
  }

  return assets
}

function normalizeTranspileDependencies(input = true) {
  if (input === true || input === false) return input
  if (Array.isArray(input)) {
    validatePackageList(input, 'transpileDependencies')
    return input
  }
  if (typeof input === 'object' && input !== null) {
    const include = input.include === undefined ? true : input.include
    const exclude = input.exclude === undefined ? [] : input.exclude

    if (include !== true && include !== false && !Array.isArray(include)) {
      throw new Error('transpileDependencies.include must be true, false, or an array of package names.')
    }
    if (Array.isArray(include)) {
      validatePackageList(include, 'transpileDependencies.include')
    }
    if (!Array.isArray(exclude)) {
      throw new Error('transpileDependencies.exclude must be an array of package names.')
    }
    validatePackageList(exclude, 'transpileDependencies.exclude')

    return { include, exclude }
  }
  throw new Error('transpileDependencies must be true, false, an array, or an object.')
}

function validatePackageList(packages, name) {
  for (const pkg of packages) {
    if (typeof pkg !== 'string' || pkg.trim() === '') {
      throw new Error(`${name} must contain only package names.`)
    }
  }
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
  if (!TARGETS.includes(input)) {
    throw new Error(`Invalid target "${input}". Expected modern, legacy, or all.`)
  }

  if ((command === 'dev' || command === 'inspect') && input === 'all') {
    throw new Error(`Command "${command}" only supports one target at a time. Use --target modern or --target legacy.`)
  }

  return input
}

export function targetIncludes(target, bundleTarget) {
  return target === 'all' || target === bundleTarget
}

export function targetList(target) {
  if (target === 'all') return ['modern', 'legacy']
  return [target]
}

function validateOutDir(outDir, { dir }) {
  if (typeof outDir !== 'string' || outDir.trim() === '') {
    throw new Error('outDir must be a non-empty relative path.')
  }
  if (path.isAbsolute(outDir)) {
    throw new Error('outDir must be relative to the project root.')
  }

  const outputPath = path.resolve(dir, outDir)
  const relativeOutputPath = path.relative(dir, outputPath)
  if (relativeOutputPath === '') {
    throw new Error('outDir must not point to the project root.')
  }
  if (relativeOutputPath.startsWith('..') || path.isAbsolute(relativeOutputPath)) {
    throw new Error('outDir must stay inside the project root.')
  }

  return outDir
}
