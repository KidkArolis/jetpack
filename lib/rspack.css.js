import { createRequire } from 'node:module'
import { CssExtractRspackPlugin, LightningCssMinimizerRspackPlugin } from '@rspack/core'

const require = createRequire(import.meta.url)

export default (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.css$/,
    exclude: [/\.global\.css$/, /node_modules/],
    use: [
      {
        loader: options.mode === 'production' ? CssExtractRspackPlugin.loader : require.resolve('style-loader')
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1,
          sourceMap: false,
          ...(options.css.modules && {
            modules: {
              localIdentName:
                options.mode === 'production'
                  ? '[name]--[local]___[hash:base64:5]'
                  : '[path][name]--[local]___[hash:base64:5]'
            }
          })
        }
      },
      {
        loader: 'builtin:lightningcss-loader',
        options: {
          sourceMap: !!options.sourceMaps,
          include: options.css?.features?.include,
          exclude: options.css?.features?.exclude
        }
      }
    ]
  })

  config.module.rules[0].oneOf.push({
    test: /\.css$/,
    use: [
      {
        loader: options.mode === 'production' ? CssExtractRspackPlugin.loader : require.resolve('style-loader')
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1,
          sourceMap: false
        }
      },
      {
        loader: 'builtin:lightningcss-loader',
        options: {
          sourceMap: !!options.sourceMaps,
          include: options.css?.features?.include,
          exclude: options.css?.features?.exclude
        }
      }
    ]
  })

  if (options.mode === 'production') {
    config.plugins.push(
      new CssExtractRspackPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[name].[contenthash:8].chunk.css',
        // if css modules are used in the project, then
        // the order should not matter (unless :global() is used)
        ignoreOrder: options.css.modules
      })
    )
    if (options.minify) {
      config.optimization.minimizer.push(new LightningCssMinimizerRspackPlugin())
    }
  }
}
