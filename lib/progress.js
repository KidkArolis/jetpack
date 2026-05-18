import rspack from '@rspack/core'

export default (log) => {
  return new rspack.ProgressPlugin({
    handler: (percentage, msg, ...args) => {
      log.status(`${Math.floor(percentage * 100)}%`, msg, ...args)
      if (percentage === 1 || (!msg && args.length === 0)) log.status('⚡️')
    }
  })
}
