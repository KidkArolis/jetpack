import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function isUsingReact(dir) {
  return hasPkgDependency('react', dir) && !!getPkgPath('react', dir)
}

function hasPkgDependency(pkg, dir) {
  try {
    const json = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    return !!(json.dependencies?.[pkg] || json.devDependencies?.[pkg] || json.peerDependencies?.[pkg])
  } catch {
    return false
  }
}

export function getPkgPath(pkg, dir) {
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

    return null
  } catch (err) {
    if (err?.code === 'MODULE_NOT_FOUND') return null
    throw err
  }
}
