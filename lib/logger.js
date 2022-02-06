const chalk = require('picocolors')

let lastType

function append(...args) {
  if (lastType === 'status') {
    if (process.stdout.isTTY) {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
    }
  }
  console.log(...args)
}

function replace(...args) {
  if (process.stdout.isTTY) {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
  }
  process.stdout.write(args.join(' '))
  if (!process.stdout.isTTY) {
    process.stdout.write('\n')
  }
}

module.exports = function (shouldLogVerbose, quiet, prefix = 'jetpack ›') {
  return { info, verbose, warn, error, status }

  function info(...args) {
    if (quiet) return
    append(chalk.green(prefix), ...args)
    lastType = 'info'
  }

  function verbose(...args) {
    if (quiet) return
    if (!shouldLogVerbose) return
    append(chalk.yellow(prefix), ...args)
    lastType = 'verbose'
  }

  function warn(...args) {
    if (quiet) return
    append(chalk.yellow(prefix), ...args)
    lastType = 'warn'
  }

  function error(...args) {
    if (quiet) return
    append(chalk.red(prefix), ...args)
    lastType = 'error'
  }

  function status(...args) {
    if (quiet) return
    replace(chalk.green(prefix), ...args.map(chalk.gray))
    lastType = 'status'
  }
}
