import { createRequire } from 'node:module'
import { CssExtractRspackPlugin } from '@rspack/core'

const require = createRequire(import.meta.url)

export default (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.scss$/,
    exclude: [/\.global\.scss$/, /node_modules/],
    use: [
      {
        loader: options.production ? CssExtractRspackPlugin.loader : require.resolve('style-loader')
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: options.css.resources ? 3 : 2,
          sourceMap: false,
          ...(options.css.modules && {
            modules: {
              localIdentName: options.production
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
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          api: 'modern-compiler',
          implementation: require.resolve('sass-embedded'),
          sourceMap: !!options.sourceMaps
        }
      },
      options.css.resources && {
        loader: require.resolve('sass-resources-loader'),
        options: {
          resources: options.css.resources,
          sourceMap: !!options.sourceMaps
        }
      }
    ].filter((x) => x)
  })

  config.module.rules[0].oneOf.push({
    test: /\.scss$/,
    use: [
      {
        loader: options.production ? CssExtractRspackPlugin.loader : require.resolve('style-loader')
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: options.css.resources ? 3 : 2,
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
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          api: 'modern-compiler',
          implementation: require.resolve('sass-embedded'),
          sourceMap: !!options.sourceMaps
        }
      },
      options.css.resources && {
        loader: require.resolve('sass-resources-loader'),
        options: {
          resources: options.css.resources,
          sourceMap: !!options.sourceMaps
        }
      }
    ].filter((x) => x)
  })
}
