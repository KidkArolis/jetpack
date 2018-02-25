const chalk = require('chalk')

module.exports = function (shouldLogVerbose) {
  return { info, verbose, warn, error }

  function info (...args) {
    console.log(chalk.green(`jetpack:`), ...args)
  }

  function verbose (...args) {
    if (!shouldLogVerbose) return
    console.log(chalk.yellow(`jetpack:`), ...args)
  }

  function warn (...args) {
    console.log(chalk.yellow(`jetpack:`), ...args)
  }

  function error (...args) {
    console.log(chalk.red(`jetpack:`), ...args)
  }
}
