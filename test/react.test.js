import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { getFreePort, runJetpack, startJetpack } from './helpers/process.js'
import resolveOptions from '../lib/options.js'
import createRspackConfig from '../lib/rspack.config.js'
import { addJetpackOverlayEntry } from '../lib/overlay/server.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const reactExample = path.join(__dirname, '..', 'examples', 'with-react')

test.serial('jetpack build compiles JSX when react is installed', async (t) => {
  // Clean dist beforehand so we don't read stale assets.
  await fs.rm(path.join(reactExample, 'dist'), { recursive: true, force: true })
  const result = await runJetpack(['build', '--log=info', '--dir', reactExample], {
    cwd: os.tmpdir(),
    env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
  })
  t.is(result.exitCode, 0, `build failed: ${result.all}`)

  const assetsDir = path.join(reactExample, 'dist', 'assets')
  const files = await fs.readdir(assetsDir)
  const bundle = files.find((f) => f.startsWith('bundle.') && f.endsWith('.js'))
  t.truthy(bundle)
  // Check chunked output too — the example splits, so JSX may land in another chunk
  const allContents = (
    await Promise.all(files.filter((f) => f.endsWith('.js')).map((f) => fs.readFile(path.join(assetsDir, f), 'utf8')))
  ).join('\n')
  // Automatic JSX runtime emits .jsx / .jsxs calls (preserved as property names even after minification)
  t.regex(allContents, /\bjsxs?\b/)
  // React APIs from the source
  t.regex(allContents, /useState|createRoot|Component/)
})

test.serial('dev server with react injects react-refresh runtime', async (t) => {
  const port = await getFreePort()
  const server = await startJetpack(['--dir', reactExample, '--port', String(port), '--log=info'], {
    readyMatcher: new RegExp(`Asset server http://localhost:${port}`),
    timeout: 20000
  })
  try {
    const res = await fetch(`http://localhost:${port}/assets/bundle.js`)
    t.is(res.status, 200)
    const body = await res.text()
    // ReactRefreshPlugin injects the react-refresh runtime + hooks
    t.regex(body, /react-refresh/i)
    t.regex(body, /\$RefreshReg\$|RefreshRuntime|\$RefreshSig\$/)
  } finally {
    await server.kill()
  }
})

test.serial('dev with react wraps createRoot error callbacks for the overlay', async (t) => {
  const port = await getFreePort()
  const server = await startJetpack(
    ['dev', '--dir', reactExample, '--host', '127.0.0.1', '--port', String(port), '--log=info'],
    {
      readyMatcher: new RegExp(`Asset server http://127\\.0\\.0\\.1:${port}`),
      timeout: 20000
    }
  )
  try {
    const res = await fetch(`http://127.0.0.1:${port}/assets/bundle.js`)
    t.is(res.status, 200)
    const body = await res.text()
    t.regex(body, /reactDomClient\.js/)
    t.regex(body, /withOverlayCallbacks/)
    t.regex(body, /onCaughtError/)
    t.regex(body, /__JETPACK_ERROR_OVERLAY__/)
  } finally {
    await server.kill()
  }
})

test('dev overlay react-dom/client alias overrides user aliases', async (t) => {
  const opts = await resolveOptions({
    command: 'dev',
    mode: 'development',
    dir: reactExample,
    overrides: {
      rspack(config) {
        config.resolve.alias['react-dom/client$'] = '/custom/react-dom-client.js'
      }
    }
  })
  const config = createRspackConfig(opts).modern

  t.is(config.resolve.alias['react-dom/client$'], '/custom/react-dom-client.js')
  addJetpackOverlayEntry(config)

  t.regex(config.resolve.alias['react-dom/client$'], /lib[/\\]overlay[/\\]reactDomClient\.js$/)
  t.regex(config.resolve.alias.__jetpack_original_react_dom_client__, /node_modules[/\\]react-dom[/\\]client\.js$/)
})
