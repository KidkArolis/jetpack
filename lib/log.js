const chalk = require('chalk')

module.exports = { info, verbose }

function info (...args) {
  console.log(chalk.green(`[jetpack]`, ...args))
}

function verbose (...args) {
  console.log(chalk.yellow(`[jetpack]`, ...args))
}
