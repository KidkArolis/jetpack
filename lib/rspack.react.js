module.exports = (config, options) => {
  if (options.react) {
    const reactPath = getReactPath(options.dir)
    if (reactPath) {
      config.resolve.alias.react = reactPath
    }
    const reactDOMPath = getReactDOMPath(options.dir)
    if (reactDOMPath) {
      config.resolve.alias['react-dom'] = reactDOMPath
    }

    config.module.rules[0].oneOf.forEach((rule) => {
      if (rule.use) {
        rule.use.forEach((loader) => {
          if (loader.loader === 'builtin:swc-loader') {
            loader.options.jsc.transform.react = {
              runtime: 'automatic',
              development: !options.production,
              refresh: !options.production && options.hot
            }
          }
        })
      }
    })
  }
}

function getReactPath(dir) {
  try {
    return require.resolve('react', { paths: [dir] }).replace(/\/index.js$/, '')
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
  return null
}

function getReactDOMPath(dir) {
  try {
    return require.resolve('react-dom', { paths: [dir] }).replace(/\/index.js$/, '')
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
  return null
}
