const options = require('./options')
const proxy = require('./lib/proxy')
const createLogger = require('./lib/logger')

const log = createLogger(options.verbose, options.quiet)

module.exports = (target) => proxy(target, log)
