import rspack from '@rspack/core'

export default function definePlugin(config, options) {
  const define = serializeDefines(options.define)
  if (Object.keys(define).length) {
    config.plugins.push(new rspack.DefinePlugin(define))
  }
}

function serializeDefines(define) {
  return Object.entries(define || {}).reduce((memo, [key, value]) => {
    memo[key] = JSON.stringify(value)
    return memo
  }, {})
}
