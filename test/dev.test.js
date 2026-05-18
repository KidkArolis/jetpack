import test from 'ava'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getFreePort, startJetpack } from './helpers/process.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

async function startDev(fixture, port) {
  return startJetpack(['--dir', path.join(fixturesDir, fixture), '--port', String(port), '--log=info'], {
    readyMatcher: new RegExp(`Asset server http://localhost:${port}`)
  })
}

test.serial('dev server returns index html on /', async (t) => {
  const port = await getFreePort()
  const server = await startDev('pkg-basic', port)
  try {
    const res = await fetch(`http://localhost:${port}/`)
    const body = await res.text()
    t.is(res.status, 200)
    t.regex(body, /<!doctype html>/i)
    t.regex(body, /\/assets\/bundle\.js/)
  } finally {
    await server.kill()
  }
})

test.serial('dev server serves js bundle', async (t) => {
  const port = await getFreePort()
  const server = await startDev('pkg-basic', port)
  try {
    const res = await fetch(`http://localhost:${port}/assets/bundle.js`)
    const body = await res.text()
    t.is(res.status, 200)
    t.regex(res.headers.get('content-type') || '', /javascript/)
    t.regex(body, /hello world/)
  } finally {
    await server.kill()
  }
})

test.serial('dev server returns index html for SPA fallback paths', async (t) => {
  const port = await getFreePort()
  const server = await startDev('pkg-basic', port)
  try {
    const res = await fetch(`http://localhost:${port}/some/spa/route`)
    const body = await res.text()
    t.is(res.status, 200)
    t.regex(body, /<!doctype html>/i)
    t.regex(body, /\/assets\/bundle\.js/)
  } finally {
    await server.kill()
  }
})

test.serial('dev server with --log=info,progress emits progress status lines', async (t) => {
  // covers logger.js status() path + progress.js handler
  const port = await getFreePort()
  const server = await startJetpack(
    ['--dir', path.join(fixturesDir, 'pkg-basic'), '--port', String(port), '--log=info,progress'],
    { readyMatcher: new RegExp(`Asset server http://localhost:${port}`) }
  )
  try {
    // webpack-dev-middleware compiles lazily — hit the server to trigger it
    await fetch(`http://localhost:${port}/`)
    // poll briefly until the progress handler has produced output
    const deadline = Date.now() + 5000
    while (Date.now() < deadline && !/(\d+%|⚡️)/.test(server.output())) {
      await new Promise((r) => setTimeout(r, 50))
    }
    t.regex(server.output(), /(\d+%|⚡️)/)
  } finally {
    await server.kill()
  }
})

test.serial('dev server mounts HMR endpoint', async (t) => {
  const port = await getFreePort()
  const server = await startDev('pkg-basic', port)
  try {
    // webpack-hot-middleware serves an SSE stream at /assets/__webpack_hmr
    const controller = new AbortController()
    const res = await fetch(`http://localhost:${port}/assets/__webpack_hmr`, { signal: controller.signal })
    t.is(res.status, 200)
    t.regex(res.headers.get('content-type') || '', /text\/event-stream/)
    controller.abort()
  } finally {
    await server.kill()
  }
})

test.serial('--exec runs a subprocess with prefixed output', async (t) => {
  const port = await getFreePort()
  // run a tiny inline node program that prints a known marker
  const server = await startJetpack(
    [
      '--dir',
      path.join(fixturesDir, 'pkg-basic'),
      '--port',
      String(port),
      '--log=info',
      '--exec',
      `node -e "console.log('subproc-out'); setInterval(() => {}, 1000)"`
    ],
    // wait for the actual prefixed subprocess output, not the announcement
    { readyMatcher: /jetpack »\s*subproc-out/, timeout: 15000 }
  )
  try {
    t.regex(server.output(), /Executing .* in a subprocess/i)
    t.regex(server.output(), /jetpack »\s*subproc-out/)
  } finally {
    await server.kill()
  }
})
