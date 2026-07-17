import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import http from 'node:http'
import express from 'express'
import { fileURLToPath } from 'node:url'
import { getFreePort, startNode, runJetpack } from './helpers/process.js'
import { serve } from '../serve.js'

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

function startMiddleware(middleware) {
  const app = express()
  app.use(middleware)

  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server))
  })
}

function startRawMiddleware(middleware) {
  const server = http.createServer((req, res) => {
    middleware(req, res, (err) => {
      res.writeHead(err ? 500 : 404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(err ? String(err) : 'Not found')
    })
  })

  return new Promise((resolve) => {
    server.listen(0, () => resolve(server))
  })
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
}

function request(port, path, { headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: 'localhost', port, path, headers }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString()
        })
      })
    })
    req.on('error', reject)
    req.end()
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
  const server = await startServeHarness({ cwd: dir, port, env: { NODE_ENV: 'production', SERVE_RESOLVED: '1' } })
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

test.serial('jetpack/serve always resolves option-shaped input', async (t) => {
  const dir = await setupTmpFixture('pkg-basic')
  const build = await runJetpack(['build', '--log=info', '--dir', dir], {
    cwd: os.tmpdir(),
    env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
  })
  t.is(build.exitCode, 0, `build failed: ${build.all}`)

  const middleware = serve({
    command: 'build',
    mode: 'production',
    dir,
    build: { outDir: 'missing' }
  })
  const server = await startMiddleware(middleware)
  const port = server.address().port

  try {
    const res = await fetch(`http://localhost:${port}/`)
    t.is(res.status, 200)
    t.regex(await res.text(), /<!doctype html>/i)
  } finally {
    await closeServer(server)
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve handles a missing production bundle with raw Node responses', async (t) => {
  const dir = await setupTmpFixture('pkg-basic')
  const middleware = serve({ command: 'build', dir, configFile: false })
  const server = await startRawMiddleware(middleware)
  const port = server.address().port

  try {
    const res = await fetch(`http://localhost:${port}/`)
    t.is(res.status, 404)
    t.is(await res.text(), 'No bundle found')
  } finally {
    await closeServer(server)
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
    t.is(res.headers.get('content-length'), null)
    t.is(res.headers.get('content-encoding'), null)
    t.is(res.headers.get('etag'), null)
    t.is(res.headers.get('last-modified'), null)
    t.is(res.headers.get('cache-control'), 'private, no-store')
  } finally {
    await server.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve resolves config lazily and proxies in development', async (t) => {
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
      t.regex(body, /\/assets\/bundle\.js/)
    } finally {
      await harnessProc.kill()
    }
  } finally {
    await dev.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve keeps normal dev proxy headers for assets with nonce enabled', async (t) => {
  const devPort = await getFreePort()
  const servePort = await getFreePort()
  const dir = await setupTmpFixture('pkg-basic', { port: devPort })
  let upstreamHeaders = null

  const backend = await startBackend(devPort, (req, res) => {
    upstreamHeaders = req.headers
    res.writeHead(200, {
      'content-type': 'application/javascript',
      'cache-control': 'public, max-age=60'
    })
    res.end('console.log("asset")')
  })

  const harnessProc = await startServeHarness({
    cwd: dir,
    port: servePort,
    env: { NODE_ENV: 'development', CSP_NONCE: 'asset-nonce' }
  })

  try {
    const res = await request(servePort, '/assets/app.js', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'br, gzip',
        'if-none-match': '"asset-etag"'
      }
    })

    t.is(res.status, 200)
    t.is(res.body, 'console.log("asset")')
    t.is(upstreamHeaders['accept-encoding'], 'br, gzip')
    t.is(upstreamHeaders['if-none-match'], '"asset-etag"')
  } finally {
    await harnessProc.kill()
    backend.close()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve requests transform-safe dev HTML when rewriting CSP nonces', async (t) => {
  const devPort = await getFreePort()
  const servePort = await getFreePort()
  const dir = await setupTmpFixture('pkg-basic', { port: devPort })
  let upstreamHeaders = null
  const html = '<!doctype html><script nonce="__JETPACK_CSP_NONCE__"></script>'

  const backend = await startBackend(devPort, (req, res) => {
    upstreamHeaders = req.headers
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-length': Buffer.byteLength(html),
      'content-encoding': 'gzip',
      etag: '"upstream-etag"',
      'last-modified': new Date('2026-01-01T00:00:00.000Z').toUTCString(),
      'cache-control': 'public, max-age=60'
    })
    res.end(html)
  })

  const harnessProc = await startServeHarness({
    cwd: dir,
    port: servePort,
    env: { NODE_ENV: 'development', CSP_NONCE: 'dev-nonce' }
  })

  try {
    const res = await request(servePort, '/', {
      headers: {
        accept: 'text/html',
        'accept-encoding': 'br, gzip',
        'if-none-match': '"browser-etag"',
        'if-modified-since': new Date('2026-01-01T00:00:00.000Z').toUTCString()
      }
    })

    t.is(res.status, 200)
    t.is(upstreamHeaders['accept-encoding'], 'identity')
    t.false('if-none-match' in upstreamHeaders)
    t.false('if-modified-since' in upstreamHeaders)
    t.true(res.body.includes('nonce="dev-nonce"'))
    t.false(res.body.includes('__JETPACK_CSP_NONCE__'))
    t.is(res.headers['content-length'], undefined)
    t.is(res.headers['content-encoding'], undefined)
    t.is(res.headers.etag, undefined)
    t.is(res.headers['last-modified'], undefined)
    t.is(res.headers['cache-control'], 'private, no-store')
  } finally {
    await harnessProc.kill()
    backend.close()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack/serve strips conditional dev HTML headers so nonce rewrites get a fresh body', async (t) => {
  const devPort = await getFreePort()
  const servePort = await getFreePort()
  const dir = await setupTmpFixture('pkg-basic', { port: devPort })
  let upstreamHeaders = null
  const html = '<!doctype html><script nonce="__JETPACK_CSP_NONCE__"></script>'

  const backend = await startBackend(devPort, (req, res) => {
    upstreamHeaders = req.headers
    if (req.headers['if-none-match']) {
      res.writeHead(304, {
        etag: '"upstream-etag"',
        'content-encoding': 'gzip'
      })
      res.end()
      return
    }

    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', etag: '"upstream-etag"' })
    res.end(html)
  })

  const harnessProc = await startServeHarness({
    cwd: dir,
    port: servePort,
    env: { NODE_ENV: 'development', CSP_NONCE: 'fresh-nonce' }
  })

  try {
    const res = await request(servePort, '/', {
      headers: {
        accept: 'text/html',
        'if-none-match': '"browser-etag"'
      }
    })

    t.is(res.status, 200)
    t.false('if-none-match' in upstreamHeaders)
    t.true(res.body.includes('nonce="fresh-nonce"'))
    t.false(res.body.includes('__JETPACK_CSP_NONCE__'))
  } finally {
    await harnessProc.kill()
    backend.close()
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
