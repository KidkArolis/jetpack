import chalk from 'picocolors'
import browserslist from 'browserslist'
import { getUserAgentRegex } from 'browserslist-useragent-regexp'

export default function browsers(options) {
  if (options.target.modern) {
    const modern = query({ ...options, bundleTarget: 'modern' })
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
    const legacy = query({ ...options, bundleTarget: 'legacy' }) || browserslist.defaults
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

export function query(options) {
  const browserslistEnv = options.bundleTarget || 'modern'
  const browsers = browserslist.loadConfig({ env: browserslistEnv, path: options.dir || process.cwd() })
  return browsers
}

export function regex(options) {
  return getUserAgentRegex({
    browsers: query(options),
    allowHigherVersions: true
  })
}
