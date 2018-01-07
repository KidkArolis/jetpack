const chalk = require('chalk')

module.exports = { info, verbose, error }

function info (...args) {
  console.log(chalk.green(`[jetpack]`, ...args))
}

function verbose (...args) {
  console.log(chalk.yellow(`[jetpack]`, ...args))
}

function error (...args) {
  console.log(chalk.red(`[jetpack]`, ...args))
}
