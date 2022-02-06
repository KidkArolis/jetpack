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

module.exports = function logger(logLevels, prefix = 'jetpack ›') {
  return { info, warn, error, status }

  function info(...args) {
    if (!logLevels.info) return
    append(chalk.green(prefix), ...args)
    lastType = 'info'
  }

  function warn(...args) {
    if (!logLevels.info) return
    append(chalk.yellow(prefix), ...args)
    lastType = 'warn'
  }

  function error(...args) {
    if (!logLevels.info) return
    append(chalk.red(prefix), ...args)
    lastType = 'error'
  }

  function status(...args) {
    if (!logLevels.progress) return
    replace(chalk.green(prefix), ...args.map(chalk.gray))
    lastType = 'status'
  }
}
