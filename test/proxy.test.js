import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { getFreePort, startJetpack } from './helpers/process.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

async function setupTmpFixture(fixture, configOverrides = {}) {
  const src = path.join(fixturesDir, fixture)
  const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-proxy-'))
  await fs.cp(src, dest, { recursive: true, filter: (s) => !s.includes(`${path.sep}dist`) })
  await fs.writeFile(
    path.join(dest, 'jetpack.config.mjs'),
    `export default ${JSON.stringify(configOverrides, null, 2)}\n`
  )
  return dest
}

// bind directly to port 0 and read back the assigned port — avoids the
// race in getFreePort where a port is freed then claimed by another test
function startBackend(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler)
    server.listen(0, () => resolve({ server, port: server.address().port }))
  })
}

test.serial('jetpack dev forwards configured proxy paths to upstream', async (t) => {
  const jetpackPort = await getFreePort()

  const { server: backend, port: backendPort } = await startBackend((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ from: 'backend', path: req.url }))
  })

  const dir = await setupTmpFixture('pkg-basic', {
    port: jetpackPort,
    proxy: { '/api/data': `http://localhost:${backendPort}/data` }
  })

  const dev = await startJetpack(['--dir', dir, '--port', String(jetpackPort), '--log=info'], {
    readyMatcher: new RegExp(`Asset server http://localhost:${jetpackPort}`)
  })

  try {
    const res = await fetch(`http://localhost:${jetpackPort}/api/data?x=1`)
    t.is(res.status, 200)
    const json = await res.json()
    t.is(json.from, 'backend')
    // jetpack's proxy forwards the original req.path verbatim (host substitution only),
    // and appends the query string explicitly
    t.is(json.path, '/api/data?x=1')
  } finally {
    await dev.kill()
    backend.close()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack dev returns 502 when upstream proxy target is unreachable', async (t) => {
  const jetpackPort = await getFreePort()
  const unreachablePort = await getFreePort() // nothing started here

  const dir = await setupTmpFixture('pkg-basic', {
    port: jetpackPort,
    proxy: { '/api/data': `http://localhost:${unreachablePort}/data` }
  })

  const dev = await startJetpack(['--dir', dir, '--port', String(jetpackPort), '--log=info'], {
    readyMatcher: new RegExp(`Asset server http://localhost:${jetpackPort}`)
  })

  try {
    const res = await fetch(`http://localhost:${jetpackPort}/api/data`)
    t.is(res.status, 502)
  } finally {
    await dev.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})
