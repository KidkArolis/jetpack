const ora = require('ora')
const chalk = require('chalk')
 
const spinner = ora('Bundling')
 
let initiated = false

module.exports = function defaultReporter (reporterOptions) {
  var time = ""
  var state = reporterOptions.state
  var stats = reporterOptions.stats
  var options = reporterOptions.options

  if(!!options.reportTime) {
    time = "[" + timestamp("HH:mm:ss") + "] "
  }

  if(state) {
    var displayStats = (!options.quiet && options.stats !== false)
    if(displayStats && !(stats.hasErrors() || stats.hasWarnings()) &&
      options.noInfo)
      displayStats = false

    if (!initiated) {
      console.log(chalk.yellow('[jetpack] Webpack ready'))
      initiated = true
    }

    if(displayStats) {
      if(stats.hasErrors()) {
        options.error(stats.toString(options.stats))
      } else if(stats.hasWarnings()) {
        options.warn(stats.toString(options.stats))
      } else {
        options.log(stats.toString(options.stats))
      }
    }

    if(!options.noInfo && !options.quiet) {
      var msg = "Compiled successfully."
      spinner.succeed(msg)
      if(stats.hasErrors()) {
        msg = "Failed to compile."
        spinner.fail(msg)
        } else if(stats.hasWarnings()) {
        msg = "Compiled with warnings."
        spinner.warn(msg)
      }
      // options.log(time + "webpack: " + msg)
    }
  } else {
    spinner.start('Bundling...')
    // options.log(time + "webpack: Compiling...")
  }
}
