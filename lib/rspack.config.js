const path = require('path')
const progress = require('./progress')
const RetryChunkLoadPlugin = require('./retryChunkLoadPlugin.js')

const plugins = {
  js: require('./rspack.js'),
  ts: require('./rspack.ts'),
  react: require('./rspack.react'),
  hot: require('./rspack.hot'),
  css: require('./rspack.css'),
  scss: require('./rspack.scss'),
  assets: require('./rspack.assets')
}

module.exports = function createRspackConfig(options, log) {
  return {
    modern: createConfig({ ...options, modern: true }, log),
    legacy: createConfig({ ...options, modern: false }, log)
  }
}

function createConfig(options, log) {
  let config = {
    target: 'web',
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
        'regenerator-runtime': path.dirname(require.resolve('regenerator-runtime')),
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
  plugins.ts(config, options)
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
