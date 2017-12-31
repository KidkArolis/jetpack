const ora = require('ora')
const chalk = require('chalk')

const spinner = ora('Bundling')

let initiated = false

module.exports = function defaultReporter (reporterOptions) {
  const state = reporterOptions.state
  const stats = reporterOptions.stats
  const options = reporterOptions.options

  if (state) {
    var displayStats = (!options.quiet && options.stats !== false)
    if (displayStats && !(stats.hasErrors() || stats.hasWarnings()) &&
      options.noInfo) { displayStats = false }

    if (!initiated) {
      console.log(chalk.yellow('[jetpack] Webpack ready'))
      initiated = true
    }

    if (displayStats) {
      if (stats.hasErrors()) {
        options.error(stats.toString(options.stats))
      } else if (stats.hasWarnings()) {
        options.warn(stats.toString(options.stats))
      } else {
        options.log(stats.toString(options.stats))
      }
    }

    if (!options.noInfo && !options.quiet) {
      var msg = 'Compiled successfully.'
      spinner.succeed(msg)
      if (stats.hasErrors()) {
        msg = 'Failed to compile.'
        spinner.fail(msg)
      } else if (stats.hasWarnings()) {
        msg = 'Compiled with warnings.'
        spinner.warn(msg)
      }
    }
  } else {
    spinner.start('Bundling...')
  }
}
