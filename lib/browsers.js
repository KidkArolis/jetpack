import chalk from 'picocolors'
import browserslist from 'browserslist'
import { getUserAgentRegex } from 'browserslist-useragent-regexp'
import { targetIncludes } from './options.js'

export default function browsers(options, _log, runtime = {}) {
  const coverage = runtime.coverage || false

  if (targetIncludes(options.target, 'modern')) {
    const modern = queryOrDefaults({ ...options, bundleTarget: 'modern' })
    const modernBrowsers = browserslist(modern)
    console.log(chalk.yellow('[modern query]'))
    console.log((Array.isArray(modern) ? modern : (modern || '').split(', ')).join('\n'))
    console.log('')
    console.log(chalk.yellow('[modern browsers]'))
    console.log(modernBrowsers.join('\n'))
    console.log('')
    console.log(chalk.yellow(`[modern coverage ${coverage || 'globally'}]`))
    console.log(browserslist.coverage(modernBrowsers, coverage || undefined).toFixed(2) + '%')
    console.log('')
  }

  if (targetIncludes(options.target, 'legacy')) {
    const legacy = queryOrDefaults({ ...options, bundleTarget: 'legacy' })
    const legacyBrowsers = browserslist(legacy)
    console.log(chalk.yellow('[legacy query]'))
    console.log((Array.isArray(legacy) ? legacy : (legacy || '').split(', ')).join('\n'))
    console.log('')
    console.log(chalk.yellow('[legacy browsers]'))
    console.log(legacyBrowsers.join('\n'))
    console.log('')
    console.log(chalk.yellow(`[legacy coverage ${coverage || 'globally'}]`))
    console.log(browserslist.coverage(legacyBrowsers, coverage || undefined).toFixed(2) + '%')
    console.log('')
  }
}

export function query(options) {
  const browserslistEnv = options.bundleTarget || 'modern'
  const browsers = browserslist.loadConfig({ env: browserslistEnv, path: options.dir || process.cwd() })
  return browsers
}

export function queryOrDefaults(options) {
  return query(options) || browserslist.defaults
}

export function regex(options) {
  return getUserAgentRegex({
    browsers: queryOrDefaults(options),
    allowHigherVersions: true
  })
}
