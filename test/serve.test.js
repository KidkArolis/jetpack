import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { getFreePort, startNode, runJetpack } from './helpers/process.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')
const harness = path.join(__dirname, 'helpers', 'serveHarness.js')

// Copy a fixture to a tmpdir and write a jetpack.config.mjs so the serve
// middleware (which reads options from cwd, not flags) picks up our port.
async function setupTmpFixture(fixture, configOverrides = {}) {
  const src = path.join(fixturesDir, fixture)
  const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-serve-'))
  await fs.cp(src, dest, { recursive: true, filter: (s) => !s.includes(`${path.sep}dist`) })
  if (Object.keys(configOverrides).length) {
    await fs.writeFile(
      path.join(dest, 'jetpack.config.mjs'),
      `export default ${JSON.stringify(configOverrides, null, 2)}\n`
    )
  }
  return dest
}

async function startServeHarness({ cwd, port, env }) {
  return startNode(harness, [], {
    cwd,
    env: { ...process.env, PORT: String(port), ...env },
    readyMatcher: new RegExp(`harness listening on ${port}`)
  })
}

function startBackend(port, handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler)
    server.listen(port, () => resolve(server))
  })
}

test.serial('jetpack/serve serves built files in production', async (t) => {
  const dir = await setupTmpFixture('pkg-basic')
  const build = await runJetpack(['build', '--log=info', '--dir', dir], {
    cwd: os.tmpdir(),
    env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
  })
  t.is(build.exitCode, 0, `build failed: ${build.all}`)

  const port = await getFreePort()
  const server = await startServeHarness({ cwd: dir, port, env: { NODE_ENV: 'production' } })
  try {
    const indexRes = await fetch(`http://localhost:${port}/`)
    const indexBody = await indexRes.text()
    t.is(indexRes.status, 200)
    t.regex(indexBody, /<!doctype html>/i)

    const spaRes = await fetch(`http://localhost:${port}/spa/route`)
    t.is(spaRes.status, 200)
    t.regex(await spaRes.text(), /<!doctype html>/i)

    const distFiles = await fs.readdir(path.join(dir, 'dist', 'assets'))
    const bundle = distFiles.find((f) => f.startsWith('bundle.') && f.endsWith('.js'))
    const assetRes = await fetch(`http://localhost:${port}/assets/${bundle}`)
    t.is(assetRes.status, 200)
    t.regex(assetRes.headers.get('content-type') || '', /javascript/)
  } finally {
    await server.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve replaces CSP nonce placeholders in production', async (t) => {
  const dir = await setupTmpFixture('pkg-basic', { html: { cspNonce: true } })
  const build = await runJetpack(['build', '--log=info', '--dir', dir], {
    cwd: os.tmpdir(),
    env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
  })
  t.is(build.exitCode, 0, `build failed: ${build.all}`)

  const builtHtml = await fs.readFile(path.join(dir, 'dist', 'index.html'), 'utf8')
  t.true(builtHtml.includes('__JETPACK_CSP_NONCE__'))

  const port = await getFreePort()
  const server = await startServeHarness({
    cwd: dir,
    port,
    env: { NODE_ENV: 'production', CSP_NONCE: 'request-nonce' }
  })
  try {
    const res = await fetch(`http://localhost:${port}/`)
    const body = await res.text()
    t.is(res.status, 200)
    t.true(body.includes('nonce="request-nonce"'))
    t.false(body.includes('__JETPACK_CSP_NONCE__'))
  } finally {
    await server.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve proxies to dev server in development', async (t) => {
  const devPort = await getFreePort()
  const servePort = await getFreePort()
  const dir = await setupTmpFixture('pkg-basic', { port: devPort })

  const dev = await startNode(
    path.join(__dirname, '..', 'bin', 'jetpack'),
    ['--dir', dir, '--port', String(devPort), '--log=info'],
    {
      readyMatcher: new RegExp(`Asset server http://localhost:${devPort}`)
    }
  )
  try {
    const harnessProc = await startServeHarness({
      cwd: dir,
      port: servePort,
      env: { NODE_ENV: 'development' }
    })
    try {
      const res = await fetch(`http://localhost:${servePort}/`)
      const body = await res.text()
      t.is(res.status, 200)
      t.regex(body, /<!doctype html>/i)
      t.regex(body, /\/assets\/bundle\.js/)
    } finally {
      await harnessProc.kill()
    }
  } finally {
    await dev.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve replaces CSP nonce placeholders when proxying dev server', async (t) => {
  const devPort = await getFreePort()
  const servePort = await getFreePort()
  const dir = await setupTmpFixture('pkg-basic', { port: devPort, html: { cspNonce: true } })

  const dev = await startNode(
    path.join(__dirname, '..', 'bin', 'jetpack'),
    ['--dir', dir, '--port', String(devPort), '--log=info'],
    {
      readyMatcher: new RegExp(`Asset server http://localhost:${devPort}`)
    }
  )
  try {
    const harnessProc = await startServeHarness({
      cwd: dir,
      port: servePort,
      env: { NODE_ENV: 'development', CSP_NONCE: 'dev-nonce' }
    })
    try {
      const res = await fetch(`http://localhost:${servePort}/`)
      const body = await res.text()
      t.is(res.status, 200)
      t.true(body.includes('nonce="dev-nonce"'))
      t.false(body.includes('__JETPACK_CSP_NONCE__'))
    } finally {
      await harnessProc.kill()
    }
  } finally {
    await dev.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve returns error page when dev server is not running', async (t) => {
  const devPort = await getFreePort()
  const servePort = await getFreePort()
  const dir = await setupTmpFixture('pkg-basic', { port: devPort })

  const harnessProc = await startServeHarness({
    cwd: dir,
    port: servePort,
    env: { NODE_ENV: 'development' }
  })
  try {
    const res = await fetch(`http://localhost:${servePort}/`, { headers: { accept: 'text/html' } })
    t.is(res.status, 502)
    t.regex(await res.text(), /jetpack not running|Failed to connect/i)
  } finally {
    await harnessProc.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve stays alive when dev server response aborts mid-stream', async (t) => {
  const devPort = await getFreePort()
  const servePort = await getFreePort()
  const dir = await setupTmpFixture('pkg-basic', { port: devPort })

  const backend = await startBackend(devPort, (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
      return
    }

    res.writeHead(200, { 'content-type': 'text/plain' })
    res.write('partial')
    setTimeout(() => res.socket.destroy(), 20)
  })

  const harnessProc = await startServeHarness({
    cwd: dir,
    port: servePort,
    env: { NODE_ENV: 'development' }
  })

  try {
    await t.throwsAsync(async () => {
      const res = await fetch(`http://localhost:${servePort}/partial`)
      await res.text()
    })

    const res = await fetch(`http://localhost:${servePort}/health`)
    t.is(res.status, 200)
    t.deepEqual(await res.json(), { ok: true })
  } finally {
    await harnessProc.kill()
    backend.close()
    await fs.rm(dir, { recursive: true, force: true })
  }
})
