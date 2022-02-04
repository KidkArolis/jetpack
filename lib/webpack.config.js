const path = require('path')

const plugins = {
  js: require('./webpack.js'),
  css: require('./webpack.css'),
  scss: require('./webpack.scss'),
  files: require('./webpack.files'),
  hot: require('./webpack.hot')
}

module.exports = async function config (options) {
  return {
    modern: await createConfig({ ...options, modern: true }),
    legacy: await createConfig({ ...options, modern: false })
  }
}

async function createConfig (options) {
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
      rules: [{
        oneOf: []
      }]
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

  if (options.production) {
    const { WebpackManifestPlugin } = require('webpack-manifest-plugin')

    config.mode = 'production'
    config.output.path = path.join(options.dir, options.dist, 'assets')
    config.output.filename = config.output.filename.replace('[name].', '[name].[contenthash].')
    config.output.chunkFilename = config.output.chunkFilename.replace('[name].', '[name].[contenthash].')
    config.optimization.splitChunks = { chunks: 'all' }
    config.optimization.runtimeChunk = true
    config.plugins.push(new WebpackManifestPlugin({ fileName: options.modern ? 'manifest.json' : 'manifest.legacy.json' }))
    config.output.publicPath = options.publicPath
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
