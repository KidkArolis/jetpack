const chalk = require('picocolors')

module.exports = function (shouldLogVerbose, quiet, prefix = 'jetpack ›') {
  return { info, verbose, warn, error }

  function info(...args) {
    if (quiet) return
    console.log(chalk.green(prefix), ...args)
  }

  function verbose(...args) {
    if (quiet) return
    if (!shouldLogVerbose) return
    console.log(chalk.yellow(prefix), ...args)
  }

  function warn(...args) {
    if (quiet) return
    console.log(chalk.yellow(prefix), ...args)
  }

  function error(...args) {
    if (quiet) return
    console.log(chalk.red(prefix), ...args)
  }
}
