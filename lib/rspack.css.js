import { createRequire } from 'node:module'
import { CssExtractRspackPlugin, LightningCssMinimizerRspackPlugin } from '@rspack/core'
import { cssModuleRule, getCssModules } from './rspack.cssModules.js'
import { loaderSourceMaps } from './rspack.sourceMaps.js'

const require = createRequire(import.meta.url)

export default (config, options) => {
  const modules = getCssModules(options)
  const moduleRule = cssModuleRule({ extension: 'css', modules })
  if (moduleRule) {
    config.module.rules[0].oneOf.push({
      ...moduleRule,
      use: createLoaders(options, { modules: modules.loaderOptions })
    })
  }

  config.module.rules[0].oneOf.push({
    test: /\.css$/,
    use: createLoaders(options)
  })

  if (options.mode === 'production') {
    config.plugins.push(
      new CssExtractRspackPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[name].[contenthash:8].css',
        // if css modules are used in the project, then
        // the order should not matter (unless :global() is used)
        ignoreOrder: modules.enabled
      })
    )
    if (options.build.minify) {
      config.optimization.minimizer.push(new LightningCssMinimizerRspackPlugin())
    }
  }
}

function createLoaders(options, { modules } = {}) {
  const sourceMap = loaderSourceMaps(options)

  return [
    {
      loader: options.mode === 'production' ? CssExtractRspackPlugin.loader : require.resolve('style-loader')
    },
    {
      loader: require.resolve('css-loader'),
      options: {
        importLoaders: 1,
        sourceMap,
        ...(modules && { modules })
      }
    },
    {
      loader: 'builtin:lightningcss-loader',
      options: {
        sourceMap
      }
    }
  ]
}
