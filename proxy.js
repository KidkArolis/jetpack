import { options as cliOptions } from './lib/cli.js'
import proxy from './lib/proxy.js'
import createLogger from './lib/logger.js'

let logPromise

function getLog() {
  if (!logPromise) {
    logPromise = cliOptions().then((opts) => createLogger(opts.logLevels))
  }
  return logPromise
}

export default (target) => {
  let handlerPromise
  return async (req, res) => {
    if (!handlerPromise) {
      handlerPromise = getLog().then((log) => proxy(target, log))
    }
    const handler = await handlerPromise
    return handler(req, res)
  }
}
