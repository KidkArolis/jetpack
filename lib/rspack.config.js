import path from 'node:path'
import { createRequire } from 'node:module'
import progress from './progress.js'
import RetryChunkLoadPlugin from './retryChunkLoadPlugin.js'
import { queryOrDefaults } from './browsers.js'
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

  // Top-level target inherits down to swc-loader and lightningcss-loader,
  // so we don't need to duplicate browserslist queries per loader.
  const browsers = queryOrDefaults(options)
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
        dir: options.dir
      }) || config
  }

  return config
}
