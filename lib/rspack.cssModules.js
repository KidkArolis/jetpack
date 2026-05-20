export function getCssModules(options) {
  const input = options.css.modules
  if (!input) {
    return { enabled: false, conventional: false, loaderOptions: null }
  }

  if (input !== true && typeof input !== 'object') {
    throw new Error('css.modules must be false, true, or an object.')
  }

  const { conventional = false, ...loaderOptions } = input === true ? {} : input
  if (typeof conventional !== 'boolean') {
    throw new Error('css.modules.conventional must be a boolean.')
  }

  return {
    enabled: true,
    conventional: conventional === true,
    loaderOptions: {
      localIdentName:
        options.mode === 'production' ? '[name]--[local]___[hash:base64:5]' : '[path][name]--[local]___[hash:base64:5]',
      ...loaderOptions
    }
  }
}

export function cssModuleRule({ extension, modules }) {
  if (!modules.enabled) return null

  return {
    test: modules.conventional ? new RegExp(`\\.module\\.${extension}$`) : new RegExp(`\\.${extension}$`),
    exclude: modules.conventional ? [/node_modules/] : [new RegExp(`\\.global\\.${extension}$`), /node_modules/]
  }
}
