const chalk = require('picocolors')

let lastType

module.exports = function (shouldLogVerbose, quiet, prefix = 'jetpack ›') {
  return { info, verbose, warn, error, status }

  function info(...args) {
    if (quiet) return
    if (lastType === 'status') {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
    }
    console.log(chalk.green(prefix), ...args)
    lastType = 'info'
  }

  function verbose(...args) {
    if (quiet) return
    if (!shouldLogVerbose) return
    if (lastType === 'status') {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
    }
    console.log(chalk.yellow(prefix), ...args)
    lastType = 'verbose'
  }

  function warn(...args) {
    if (quiet) return
    if (lastType === 'status') {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
    }
    console.log(chalk.yellow(prefix), ...args)
    lastType = 'warn'
  }

  function error(...args) {
    if (quiet) return
    if (lastType === 'status') {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
    }
    console.log(chalk.red(prefix), ...args)
    lastType = 'error'
  }

  function status(...args) {
    if (quiet) return
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write([chalk.green(prefix), ...args.map(chalk.gray)].join(' '))
    lastType = 'status'
  }
}
