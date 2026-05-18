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

const require = createRequire(import.meta.url)

const plugins = {
  js: jsPlugin,
  react: reactPlugin,
  hot: hotPlugin,
  css: cssPlugin,
  scss: scssPlugin,
  assets: assetsPlugin
}

export default function createRspackConfig(options, log) {
  return {
    modern: createConfig({ ...options, modern: true }, log),
    legacy: createConfig({ ...options, modern: false }, log)
  }
}

function createConfig(options, log) {
  // Top-level target inherits down to swc-loader and lightningcss-loader,
  // so we don't need to duplicate browserslist queries per loader.
  const browsers = query(options)
  const target = browsers && browsers.length ? ['web', `browserslist:${browsers.join(', ')}`] : 'web'

  let config = {
    target,
    entry: {
      bundle: options.entry
    },
    output: {
      path: path.join(process.cwd(), 'assets'),
      filename: options.modern ? '[name].js' : '[name].legacy.js',
      chunkFilename: options.modern ? '[name].js' : '[name].legacy.js',
      publicPath: '/assets/'
    },
    mode: 'development',
    devtool: options.sourceMaps,
    module: {
      rules: [
        {
          oneOf: []
        }
      ]
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
    performance: {
      // once you put React in .. it goes above default max
      maxAssetSize: 500_000,
      maxEntrypointSize: 500_000
    },
    plugins: options.chunkLoadRetry
      ? [new RetryChunkLoadPlugin(options.chunkLoadRetry === true ? {} : options.chunkLoadRetry)]
      : [],
    devServer: {
      publicPath: '/assets/',
      stats: 'none'
    },
    infrastructureLogging: {
      level: 'none'
    }
  }

  if (options.logLevels.progress && log) {
    config.plugins.push(progress(log))
  }

  if (options.production) {
    config.mode = 'production'
    config.output.path = path.join(options.dir, options.dist, 'assets')
    config.output.filename = config.output.filename.replace('[name].', '[name].[contenthash].')
    config.output.chunkFilename = config.output.chunkFilename.replace('[name].', '[name].[contenthash].')
    config.output.publicPath = options.publicPath
    config.optimization.splitChunks = { chunks: 'all' }
    config.optimization.runtimeChunk = true
    config.optimization.usedExports = true
  }

  plugins.js(config, options)
  plugins.react(config, options)
  plugins.hot(config, options)
  plugins.scss(config, options)
  plugins.css(config, options)
  plugins.assets(config, options)

  if (options.rspack) {
    config = options.rspack(config, options) || config
  }

  return config
}
