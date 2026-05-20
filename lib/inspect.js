import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'
import { spawn } from 'node:child_process'
import rspack from '@rspack/core'
import chalk from 'picocolors'
import createRspackConfig from './rspack.config.js'
import template from './inspect-template.js'

export default async function inspect(options, log) {
  log.info('Building production bundle for inspection...')
  const rspackConfigs = createRspackConfig(options, log)
  const rspackConfig = options.target.modern ? rspackConfigs.modern : rspackConfigs.legacy
  const compiler = rspack(rspackConfig)

  const stats = await new Promise((resolve, reject) => {
    compiler.run((err, stats) => (err ? reject(err) : resolve(stats)))
  })
  await new Promise((resolve, reject) => {
    compiler.close((err) => (err ? reject(err) : resolve()))
  })
  if (stats.hasErrors()) {
    log.error('Build had errors')
    console.log(stats.toString({ colors: true }))
  }

  const json = stats.toJson({
    all: true,
    groupAssetsByPath: false,
    groupAssetsByExtension: false,
    groupAssetsByEmitStatus: false,
    groupAssetsByInfo: false,
    groupAssetsByChunk: false,
    groupModulesByPath: false,
    groupModulesByExtension: false,
    groupModulesByCacheStatus: false,
    groupModulesByLayer: false,
    groupModulesByAttributes: false,
    groupModulesByType: false,
    groupChunksByPath: false,
    groupChunksByExtension: false
  })

  const treemap = await buildTreemap(json, json.outputPath)
  const html = template({
    title: `jetpack inspect — ${treemap.name}`,
    data: treemap,
    totals: sumTotals(treemap)
  })

  // Write next to the output root, not inside assets/
  const target = path.join(options.dir, options.build.outDir, 'inspect.html')
  await fs.writeFile(target, html)
  log.info(`Wrote ${chalk.bold(path.relative(options.dir, target))} (${human(html.length)})`)

  if (process.stdout.isTTY) {
    openInBrowser(target)
  }
}

async function buildTreemap(json, outputPath) {
  const chunkById = new Map((json.chunks || []).map((c) => [c.id, c]))
  const jsAssets = (json.assets || []).filter((a) => /\.(js|cjs|mjs)$/.test(a.name) && (a.chunks || []).length > 0)

  const children = await Promise.all(
    jsAssets.map(async (asset) => {
      const fullPath = path.join(outputPath, asset.name)
      const stat = asset.size ?? 0
      let parsed = 0
      let gzip = 0
      try {
        const buf = await fs.readFile(fullPath)
        parsed = buf.byteLength
        gzip = zlib.gzipSync(buf).byteLength
      } catch {
        /* file missing — leave parsed/gzip at 0 */
      }

      // Module-level breakdown (stat sizes only — we don't parse the bundle).
      const modules = []
      for (const chunkId of asset.chunks) {
        const chunk = chunkById.get(chunkId)
        for (const m of chunk?.modules || []) {
          modules.push({ name: friendlyModuleName(m.name), statSize: m.size })
        }
      }

      return {
        name: asset.name,
        statSize: stat,
        parsedSize: parsed,
        gzipSize: gzip,
        children: modules
      }
    })
  )

  return {
    name: 'bundle',
    children: children.sort((a, b) => b.parsedSize - a.parsedSize)
  }
}

function friendlyModuleName(name) {
  // strip loader prefixes like `path/to/loader.js!./real-module.js`
  const bang = name.lastIndexOf('!')
  return bang >= 0 ? name.slice(bang + 1) : name
}

function sumTotals(node) {
  const totals = { stat: 0, parsed: 0, gzip: 0 }
  for (const c of node.children || []) {
    totals.stat += c.statSize || 0
    totals.parsed += c.parsedSize || 0
    totals.gzip += c.gzipSize || 0
  }
  return totals
}

function human(n) {
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KiB'
  return (n / (1024 * 1024)).toFixed(2) + ' MiB'
}

function openInBrowser(file) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  spawn(cmd, [file], { detached: true, stdio: 'ignore' }).unref()
}
