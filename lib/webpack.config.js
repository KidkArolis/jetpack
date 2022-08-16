const path = require('path')
const progress = require('./progress')

const plugins = {
  js: require('./webpack.js'),
  css: require('./webpack.css'),
  scss: require('./webpack.scss'),
  files: require('./webpack.files'),
  hot: require('./webpack.hot')
}

module.exports = async function config(options, log) {
  return {
    modern: await createConfig({ ...options, modern: true }, log),
    legacy: await createConfig({ ...options, modern: false }, log)
  }
}

async function createConfig(options, log) {
  let config = {
    entry: {
      bundle: ['core-js/stable', options.entry]
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
        'regenerator-runtime': path.dirname(require.resolve('regenerator-runtime'))
      }
    },
    optimization: {
      minimizer: []
    },
    plugins: [],
    devServer: {
      publicPath: '/assets/',
      stats: 'none'
    },
    infrastructureLogging: {
      level: 'none'
    },
    experiments: {
      backCompat: false
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
    config.optimization.runtimeChunk = 'single'
    config.optimization.usedExports = true
  }

  await plugins.js(config, options)
  await plugins.scss(config, options)
  await plugins.css(config, options)
  await plugins.files(config, options)
  await plugins.hot(config, options)

  if (options.webpack) {
    config = (await options.webpack(config, options)) || config
  }

  return config
}
