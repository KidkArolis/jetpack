import path from 'node:path'
import { createRequire } from 'node:module'
import progress from './progress.js'
import RetryChunkLoadPlugin from './retryChunkLoadPlugin.js'
import { query } from './browsers.js'
import jsPlugin from './rspack.js.js'
import reactPlugin from './rspack.react.js'
import hotPlugin from './rspack.hot.js'
import cssPlugin from './rspack.css.js'
import scssPlugin from './rspack.scss.js'
import assetsPlugin from './rspack.assets.js'
import definePlugin from './rspack.define.js'

const require = createRequire(import.meta.url)

export default function createRspackConfig(options, log) {
  return {
    modern: createConfig(options, log, 'modern'),
    legacy: createConfig(options, log, 'legacy')
  }
}

function createConfig(baseOptions, log, bundleTarget) {
  const options = { ...baseOptions, bundleTarget }

  // Top-level target inherits down to swc-loader and lightningcss-loader,
  // so we don't need to duplicate browserslist queries per loader.
  const browsers = query(options)
  const target = browsers && browsers.length ? ['web', `browserslist:${browsers.join(', ')}`] : 'web'

  // Single conditional filename pattern. `[contenthash]` is added in
  // production for cache busting; `.legacy` distinguishes the legacy bundle.
  const suffix = bundleTarget === 'modern' ? '' : '.legacy'
  const hash = options.production ? '.[contenthash]' : ''
  const filename = `[name]${hash}${suffix}.js`

  let config = {
    context: options.dir,
    target,
    entry: {
      bundle: options.entry
    },
    output: {
      path: path.join(options.dir, options.outDir, 'assets'),
      filename,
      chunkFilename: filename,
      assetModuleFilename: '[name].[contenthash:8][ext]',
      // 'auto' lets the bundle compute the publicPath at runtime from the
      // script's own URL — works for CDN deployments and sub-path mounts
      // without the user having to override anything.
      publicPath: 'auto'
    },
    mode: options.production ? 'production' : 'development',
    devtool: options.sourceMaps,
    module: {
      rules: [{ oneOf: [] }]
    },
    resolve: {
      alias: {
        'core-js': path.dirname(require.resolve('core-js')),
        '@swc/helpers': path.dirname(require.resolve('@swc/helpers/package.json'))
      }
    },
    optimization: {
      minimizer: []
    },
    plugins: options.chunkLoadRetry
      ? [new RetryChunkLoadPlugin(options.chunkLoadRetry === true ? {} : options.chunkLoadRetry)]
      : [],
    infrastructureLogging: { level: 'none' }
  }

  if (options.logLevels.progress && log) {
    config.plugins.push(progress(log))
  }

  if (options.production) {
    config.optimization.runtimeChunk = true
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
