import { getPkgPath, isUsingReact } from './react.js'

export default (config, options) => {
  if (!isUsingReact(options.dir)) return

  const reactPath = getPkgPath('react', options.dir)

  config.resolve.alias.react = reactPath
  const reactDOMPath = getPkgPath('react-dom', options.dir)
  if (reactDOMPath) {
    config.resolve.alias['react-dom'] = reactDOMPath
  }

  config.module.rules[0].oneOf.forEach((rule) => {
    if (rule.use) {
      rule.use.forEach((loader) => {
        if (loader.loader === 'builtin:swc-loader') {
          loader.options.jsc ??= {}
          loader.options.jsc.transform ??= {}
          loader.options.jsc.transform.react = {
            runtime: 'automatic',
            development: options.mode !== 'production',
            refresh: options.mode !== 'production' && options.hot.enabled
          }
        }
      })
    }
  })
}
