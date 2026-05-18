import rspack from '@rspack/core'

export default (log) => {
  return new rspack.ProgressPlugin({
    // Rspack 2 changed the handler's third argument from `items: string[]` to
    // an `info` object — ignore it so we don't render "[object Object]".
    handler: (percentage, msg) => {
      log.status(`${Math.floor(percentage * 100)}%`, msg)
      if (percentage === 1 || !msg) log.status('⚡️')
    }
  })
}
