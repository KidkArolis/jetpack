const chalk = require('picocolors')
const browserslist = require('browserslist')

function browsers(options) {
  if (options.target.modern) {
    const modern = query({ modern: true })
    const modernBrowsers = browserslist(modern)
    console.log(chalk.yellow('[modern query]'))
    console.log((Array.isArray(modern) ? modern : (modern || '').split(', ')).join('\n'))
    console.log('')
    console.log(chalk.yellow('[modern browsers]'))
    console.log(modernBrowsers.join('\n'))
    console.log('')
    console.log(chalk.yellow(`[modern coverage ${options.coverage || 'globally'}]`))
    console.log(browserslist.coverage(modernBrowsers, options.coverage || undefined).toFixed(2) + '%')
    console.log('')
  }

  if (options.target.legacy) {
    const legacy = query({ modern: false }) || browserslist.defaults
    const legacyBrowsers = browserslist(legacy)
    console.log(chalk.yellow('[legacy query]'))
    console.log((Array.isArray(legacy) ? legacy : (legacy || '').split(', ')).join('\n'))
    console.log('')
    console.log(chalk.yellow('[legacy browsers]'))
    console.log(legacyBrowsers.join('\n'))
    console.log('')
    console.log(chalk.yellow(`[legacy coverage ${options.coverage || 'globally'}]`))
    console.log(browserslist.coverage(legacyBrowsers, options.coverage || undefined).toFixed(2) + '%')
    console.log('')
  }
}

function query(options) {
  const browserslistEnv = options.modern ? 'modern' : 'legacy'
  const browsers = browserslist.loadConfig({ env: browserslistEnv, path: '.' })
  return browsers
}

async function regex(options) {
  const { getUserAgentRegex } = await import('browserslist-useragent-regexp')
  return getUserAgentRegex({
    browsers: query(options),
    allowHigherVersions: true
  })
}

module.exports = browsers
module.exports.query = query
module.exports.regex = regex
