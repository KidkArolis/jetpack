import { readFileSync } from 'node:fs'
import path from 'node:path'
import { targetIncludes } from './options.js'

export function createDevManifest(options, { modern = targetIncludes(options.target, 'modern') } = {}) {
  return {
    js: [options.assetBaseUrl + (modern ? 'bundle.js' : 'bundle.legacy.js')],
    css: [],
    runtime: [],
    other: [],
    inlineRuntime: null
  }
}

export function createBuildManifest(options, stats) {
  const { outputPath, entrypoints } = stats
  const manifest = {
    js: [],
    css: [],
    runtime: [],
    other: [],
    inlineRuntime: null
  }

  for (const { name: asset } of entrypoints.bundle.assets) {
    const assetPath = options.assetBaseUrl + asset
    if (asset.startsWith('runtime~bundle') && asset.endsWith('.js')) {
      manifest.runtime.push(assetPath)
    } else if (asset.endsWith('.js')) {
      manifest.js.push(assetPath)
    } else if (asset.endsWith('.css')) {
      manifest.css.push(assetPath)
    } else {
      manifest.other.push(assetPath)
    }
  }

  manifest.inlineRuntime = readInlineRuntime({ outputPath, assetBaseUrl: options.assetBaseUrl, entrypoints })
  return manifest
}

export function publicManifest(manifest) {
  const publicFields = { ...manifest }
  delete publicFields.inlineRuntime
  return publicFields
}

function readInlineRuntime({ outputPath, assetBaseUrl, entrypoints }) {
  const runtimeAsset = entrypoints?.bundle?.assets.find((a) => a.name.startsWith('runtime~bundle.'))
  if (!runtimeAsset) return null

  try {
    const runtime = String(readFileSync(path.join(outputPath, runtimeAsset.name)))
    // Since we inline the runtime at the root index html, correct the sourceMappingURL.
    return runtime.replace('//# sourceMappingURL=', `//# sourceMappingURL=${assetBaseUrl}`)
  } catch {
    return null
  }
}
