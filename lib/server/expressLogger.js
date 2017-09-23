const log = require('./log')

module.exports = function (options) {
  return require('express-driftwood')(log, Object.assign({
    // TODO - configurable
    // ignore: ['/status', '/metrics']
  }, options))
}