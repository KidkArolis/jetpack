import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SUPPORTED_CONFIG_FILES = ['jetpack.config.js', 'jetpack.config.mjs', 'jetpack.config.cjs']
const CONFIG_OPTION_KEYS = [
  'entry',
  'port',
  'host',
  'assetBaseUrl',
  'hot',
  'dev',
  'target',
  'polyfills',
  'define',
  'proxy',
  'log',
  'build',
  'html',
  'css',
  'assets',
  'transpileDependencies',
  'rspack'
]

export default resolveOptions

const TARGETS = ['modern', 'legacy', 'all']
const LOG_LEVELS = ['info', 'progress', 'all', 'silent', 'none']

export async function resolveOptions({
  command = 'dev',
  mode = defaultMode(command),
  dir = process.cwd(),
  entry = null,
  config,
  configFile,
  overrides = {}
} = {}) {
  dir = path.resolve(dir)
  mode = validateMode(mode)
  const configPath = resolveConfigPath(dir, configFile ?? config)

  const configFromFile = await readConfigFromFile(configPath)
  validateMovedConfigOptions(configFromFile)
  const options = mergeConfig(configFromFile, pick(overrides, CONFIG_OPTION_KEYS))

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
  const assetBaseUrl = validateAssetBaseUrl(options.assetBaseUrl)
  const target = resolveTarget(options.target ?? 'modern', { command })
  const css = normalizeCss(options.css)
  const assets = normalizeAssets(options.assets)
  const transpileDependencies = normalizeTranspileDependencies(options.transpileDependencies)
  const port = validatePort(options.port === undefined ? 3030 : options.port)
  const host = validateHost(options.host || 'localhost')
  const define = validateDefine(options.define)
  const proxy = validateProxy(options.proxy)
  const dev = normalizeDev(options.dev)
  const rspack = validateRspack(options.rspack)

  return clean({
    command,

    mode,

    // directory to run jetpack in
    dir,

    // entry module path relative to dir
    entry,

    // port of the dev server
    port,

    // host of the dev server
    host,

    build,

    assetBaseUrl,

    // The URL pathname portion of `assetBaseUrl`, normalised with a trailing
    // slash. Used by the dev server to mount middlewares at the right
    // location. Works whether assetBaseUrl is a path (`/assets/`) or a full
    // URL (`https://cdn.example.com/bundles/`).
    assetBasePathname: pathnameWithTrailingSlash(assetBaseUrl),

    // hot reloading
    hot: parseHot(options.hot),

    dev,

    // build-time constants passed to rspack.DefinePlugin
    define,

    polyfills: normalizePolyfills(options.polyfills),

    target,

    // used for proxying certain requests to a different server
    // can be an object or a function
    proxy,

    // log levels to output
    logLevels: parseLogLevels(options.log),

    html,

    css,

    assets,

    transpileDependencies,

    // rspack config transform fn
    rspack
  })
}

function resolveConfigPath(dir, configFilePath) {
  if (configFilePath === false) return null
  if (configFilePath) return path.resolve(dir, configFilePath)
  const defaultConfig = SUPPORTED_CONFIG_FILES.find((file) => existsSync(path.join(dir, file)))
  return defaultConfig ? path.join(dir, defaultConfig) : null
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
  if (input !== undefined && (typeof input !== 'object' || input === null || Array.isArray(input))) {
    throw new Error('css must be an object.')
  }

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

function normalizePolyfills(input = 'usage') {
  if (input === 'usage' || input === 'entry' || input === false) return input
  throw new Error('polyfills must be "usage", "entry", or false.')
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

async function readConfigFromFile(configFilePath) {
  if (!configFilePath) return {}
  if (!existsSync(configFilePath)) return {}
  const mod = await import(pathToFileURL(configFilePath).href)
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
  for (const level of levels) {
    if (!level) continue
    if (!LOG_LEVELS.includes(level)) {
      throw new Error(`Invalid log level "${level}". Expected info, progress, all, silent, or none.`)
    }
  }

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
    if (Array.isArray(input)) {
      throw new Error('hot must be a boolean or an object.')
    }
    if (input.enabled !== undefined && typeof input.enabled !== 'boolean') {
      throw new Error('hot.enabled must be a boolean.')
    }
    if (input.quiet !== undefined && typeof input.quiet !== 'boolean') {
      throw new Error('hot.quiet must be a boolean.')
    }
    return {
      enabled: input.enabled !== false,
      quiet: input.quiet === true
    }
  }
  if (input !== undefined && typeof input !== 'boolean') {
    throw new Error('hot must be a boolean or an object.')
  }
  return {
    enabled: input !== false,
    quiet: false
  }
}

function normalizeDev(input) {
  if (input !== undefined && (typeof input !== 'object' || input === null || Array.isArray(input))) {
    throw new Error('dev must be an object.')
  }

  const dev = Object.assign(
    {
      overlay: true
    },
    input
  )

  if (typeof dev.overlay !== 'boolean') {
    throw new Error('dev.overlay must be a boolean.')
  }

  return dev
}

function pathnameWithTrailingSlash(url) {
  const pathname = new URL(url, 'http://localhost').pathname
  return pathname.endsWith('/') ? pathname : pathname + '/'
}

function withTrailingSlash(url) {
  return url.endsWith('/') ? url : url + '/'
}

function validateAssetBaseUrl(input = '/assets/') {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('assetBaseUrl must be a non-empty string.')
  }
  return withTrailingSlash(input)
}

function validatePort(input) {
  const port = typeof input === 'string' && input.trim() !== '' ? Number(input) : input
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('port must be an integer between 0 and 65535.')
  }
  return input
}

function validateHost(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('host must be a non-empty string.')
  }
  return input
}

function validateDefine(input) {
  if (input === undefined) return {}
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('define must be an object.')
  }
  return input
}

function validateProxy(input) {
  if (input === undefined) return {}
  if (typeof input === 'function') return input
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('proxy must be an object or a function.')
  }
  return input
}

function validateRspack(input) {
  if (input !== undefined && typeof input !== 'function') {
    throw new Error('rspack must be a function.')
  }
  return input
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

function mergeConfig(base, override) {
  const config = { ...base, ...override }

  for (const key of ['build', 'html', 'css', 'assets', 'dev']) {
    if (base[key] !== undefined || override[key] !== undefined) {
      config[key] = mergeNestedConfig(base[key], override[key])
    }
  }

  return config
}

function mergeNestedConfig(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override
  }
  return { ...base, ...override }
}

function isPlainObject(input) {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}
