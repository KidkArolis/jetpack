import { createRequire } from 'node:module'
import { CssExtractRspackPlugin } from '@rspack/core'
import { cssModuleRule, getCssModules } from './rspack.cssModules.js'
import { loaderSourceMaps } from './rspack.sourceMaps.js'

const require = createRequire(import.meta.url)

export default (config, options) => {
  const modules = getCssModules(options)
  const moduleRule = cssModuleRule({ extension: 'scss', modules })
  if (moduleRule) {
    config.module.rules[0].oneOf.push({
      ...moduleRule,
      use: createLoaders(options, { modules: modules.loaderOptions })
    })
  }

  config.module.rules[0].oneOf.push({
    test: /\.scss$/,
    use: createLoaders(options)
  })
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
        importLoaders: 2,
        sourceMap,
        ...(modules && { modules })
      }
    },
    {
      loader: 'builtin:lightningcss-loader',
      options: {
        sourceMap
      }
    },
    {
      loader: require.resolve('sass-loader'),
      options: {
        implementation: require.resolve('sass-embedded'),
        sourceMap
      }
    }
  ]
}
