const createLogger = require('driftwood')

const level = 'info'
if (level !== 'silent') {
  createLogger.enable({ '*': level })
}

module.exports = createLogger('jetpack')
