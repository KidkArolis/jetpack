import path from 'node:path'
import { createRequire } from 'node:module'
import progress from './progress.js'
import RetryChunkLoadPlugin from './retryChunkLoadPlugin.js'
import { targetQuery } from './browsers.js'
import jsPlugin from './rspack.js.js'
import reactPlugin from './rspack.react.js'
import hotPlugin from './rspack.hot.js'
import cssPlugin from './rspack.css.js'
import scssPlugin from './rspack.scss.js'
import assetsPlugin from './rspack.assets.js'
import definePlugin from './rspack.define.js'
import { targetList } from './options.js'

const require = createRequire(import.meta.url)

export default function createRspackConfig(options, log, runtime = {}) {
  const configs = {}
  for (const bundleTarget of targetList(runtime.target || options.target || 'modern')) {
    configs[bundleTarget] = createConfig(options, log, bundleTarget)
  }
  return configs
}

function createConfig(baseOptions, log, bundleTarget) {
  const options = { ...baseOptions, bundleTarget }

  // Resolve queries before passing them to Rspack/SWC because their target
  // parser may lag behind Browserslist query syntax like Baseline.
  const browsers = targetQuery(options)
  const target = ['web', `browserslist:${browsers.join(', ')}`]

  // Single conditional filename pattern. `[contenthash]` is added in
  // production for cache busting; `.legacy` distinguishes the legacy bundle.
  const suffix = bundleTarget === 'modern' ? '' : '.legacy'
  const hash = options.mode === 'production' ? '.[contenthash]' : ''
  const filename = `[name]${hash}${suffix}.js`

  let config = {
    context: options.dir,
    target,
    entry: {
      bundle: options.entry
    },
    output: {
      path: path.join(options.dir, options.build.outDir, 'assets'),
      filename,
      chunkFilename: filename,
      assetModuleFilename: '[name].[contenthash:8][ext]',
      // 'auto' lets the bundle compute the publicPath at runtime from the
      // script's own URL — works for CDN deployments and sub-path mounts
      // without the user having to override anything.
      publicPath: 'auto'
    },
    mode: options.mode,
    devtool: options.build.sourceMaps,
    module: {
      rules: [{ oneOf: [] }]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.mjs', '...'],
      alias: {
        'core-js': path.dirname(require.resolve('core-js')),
        '@swc/helpers': path.dirname(require.resolve('@swc/helpers/package.json'))
      }
    },
    optimization: {
      minimizer: []
    },
    plugins: options.build.chunkLoadRetry
      ? [new RetryChunkLoadPlugin(options.build.chunkLoadRetry === true ? {} : options.build.chunkLoadRetry)]
      : [],
    infrastructureLogging: { level: 'none' }
  }

  if (options.logLevels.progress && log) {
    config.plugins.push(progress(log))
  }

  if (options.mode === 'production') {
    config.optimization.runtimeChunk = true
    config.optimization.splitChunks = {
      chunks: 'all'
    }
  }

  jsPlugin(config, options)
  reactPlugin(config, options)
  hotPlugin(config, options)
  scssPlugin(config, options)
  cssPlugin(config, options)
  assetsPlugin(config, options)
  definePlugin(config, options)

  if (options.rspack) {
    config =
      options.rspack(config, {
        command: options.command,
        mode: options.mode,
        target: bundleTarget,
        dir: options.dir,
        findLoader: (name) => findLoader(config, name)
      }) || config
  }

  return config
}

function findLoader(config, name) {
  if (typeof name !== 'string' && !(name instanceof RegExp)) {
    throw new Error('findLoader expects a loader name string or RegExp.')
  }

  const loaders = []
  const rules = config.module?.rules || []

  for (const rule of rules) {
    collectMatchingLoaders(rule, name, loaders)
  }

  return loaders
}

function collectMatchingLoaders(rule, name, loaders) {
  if (!rule || typeof rule !== 'object') return

  if (matchesLoaderName(rule.loader, name)) {
    loaders.push(rule)
  }

  for (const loader of useItems(rule.use)) {
    if (typeof loader === 'object' && loader !== null && matchesLoaderName(loader.loader, name)) {
      loaders.push(loader)
    }
  }

  for (const child of rule.oneOf || []) {
    collectMatchingLoaders(child, name, loaders)
  }

  for (const child of rule.rules || []) {
    collectMatchingLoaders(child, name, loaders)
  }
}

function useItems(use) {
  if (!use) return []
  return Array.isArray(use) ? use : [use]
}

function matchesLoaderName(loader, name) {
  if (typeof loader !== 'string') return false
  if (name instanceof RegExp) {
    name.lastIndex = 0
    return name.test(loader)
  }

  const normalizedLoader = loader.replaceAll('\\', '/')
  const normalizedName = name.replaceAll('\\', '/')
  return normalizedLoader === normalizedName || normalizedLoader.includes(normalizedName)
}
