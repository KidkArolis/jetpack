const chalk = require('chalk')

module.exports = function (shouldLogVerbose, quiet) {
  return { info, verbose, warn, error }

  function info (...args) {
    if (quiet) return
    console.log(chalk.green(`jetpack:`), ...args)
  }

  function verbose (...args) {
    if (quiet) return
    if (!shouldLogVerbose) return
    console.log(chalk.yellow(`jetpack:`), ...args)
  }

  function warn (...args) {
    if (quiet) return
    console.log(chalk.yellow(`jetpack:`), ...args)
  }

  function error (...args) {
    if (quiet) return
    console.log(chalk.red(`jetpack:`), ...args)
  }
}
