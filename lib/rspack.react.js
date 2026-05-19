import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export default (config, options) => {
  if (options.react) {
    const reactPath = getPkgPath('react', options.dir)
    if (reactPath) {
      config.resolve.alias.react = reactPath
    }
    const reactDOMPath = getPkgPath('react-dom', options.dir)
    if (reactDOMPath) {
      config.resolve.alias['react-dom'] = reactDOMPath
    }

    config.module.rules[0].oneOf.forEach((rule) => {
      if (rule.use) {
        rule.use.forEach((loader) => {
          if (loader.loader === 'builtin:swc-loader') {
            loader.options.jsc ??= {}
            loader.options.jsc.transform ??= {}
            loader.options.jsc.transform.react = {
              runtime: 'automatic',
              development: !options.production,
              refresh: !options.production && options.hot.enabled
            }
          }
        })
      }
    })
  }
}

function getPkgPath(pkg, dir) {
  try {
    const entry = require.resolve(pkg, { paths: [dir] })

    let curr = path.dirname(entry)
    const root = path.parse(curr).root

    while (true) {
      const pkgJsonPath = path.join(curr, 'package.json')
      if (existsSync(pkgJsonPath)) {
        try {
          const json = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
          if (json.name === pkg) return curr
        } catch {
          // if unreadable/invalid JSON, keep walking
        }
      }
      if (curr === root) break
      const parent = path.dirname(curr)
      if (parent === curr) break
      curr = parent
    }

    return null // Shouldn't usually happen if resolve succeeded
  } catch (err) {
    if (err?.code === 'MODULE_NOT_FOUND') return null
    throw err
  }
}
