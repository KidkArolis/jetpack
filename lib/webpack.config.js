const path = require('path')
const progress = require('./progress')
const RetryChunkLoadPlugin = require('./retryChunkLoadPlugin.js')

const plugins = {
  js: require('./webpack.js'),
  ts: require('./webpack.ts'),
  react: require('./webpack.react'),
  hot: require('./webpack.hot'),
  css: require('./webpack.css'),
  scss: require('./webpack.scss'),
  assets: require('./webpack.assets')
}

module.exports = async function config(options, log) {
  return {
    modern: await createConfig({ ...options, modern: true }, log),
    legacy: await createConfig({ ...options, modern: false }, log)
  }
}

async function createConfig(options, log) {
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

  await plugins.js(config, options)
  await plugins.ts(config, options)
  await plugins.react(config, options)
  await plugins.hot(config, options)
  await plugins.scss(config, options)
  await plugins.css(config, options)
  await plugins.assets(config, options)

  if (options.rspack) {
    config = (await options.rspack(config, options)) || config
  }

  return config
}
