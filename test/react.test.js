import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getFreePort, runJetpack, startJetpack } from './helpers/process.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// The `with-react` example already has react/react-dom installed, so we use it
// to exercise the React-specific code paths (rspack.react.js + the
// ReactRefresh branch in rspack.hot.js).
const reactExample = path.join(__dirname, '..', 'examples', 'with-react')

test.before(async () => {
  if (!existsSync(path.join(reactExample, 'node_modules', 'react'))) {
    throw new Error('examples/with-react needs `npm install` before running react tests')
  }
})

test.serial('jetpack build compiles JSX when react is installed', async (t) => {
  // build inline (not in a tmpdir) so we get the example's node_modules.
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
