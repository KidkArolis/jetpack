import test from 'ava'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getFreePort, startJetpack } from './helpers/process.js'
import { createBuildErrorMessage } from '../lib/overlay/server.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

async function startDev(fixture, port) {
  return startJetpack(['--dir', path.join(fixturesDir, fixture), '--port', String(port), '--log=info'], {
    readyMatcher: new RegExp(`Asset server http://localhost:${port}`)
  })
}

async function startDevOnHost(fixture, port) {
  return startJetpack(
    ['dev', '--dir', path.join(fixturesDir, fixture), '--host', '127.0.0.1', '--port', String(port), '--log=info'],
    {
      readyMatcher: new RegExp(`Asset server http://127\\.0\\.0\\.1:${port}`)
    }
  )
}

async function readOverlayEvent(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  const response = await fetch(url, { signal: controller.signal })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''

  try {
    while (!text.includes('\n\n')) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }
  } finally {
    clearTimeout(timer)
    controller.abort()
  }

  const line = text.split('\n').find((part) => part.startsWith('data: '))
  if (!line) throw new Error(`Missing overlay event in response:\n${text}`)
  return JSON.parse(line.slice('data: '.length))
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
    // hit the server to make sure compilation has started
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

test.serial('dev server injects Rspack dev-server client for HMR', async (t) => {
  const port = await getFreePort()
  const server = await startDev('pkg-basic', port)
  try {
    const res = await fetch(`http://localhost:${port}/assets/bundle.js`)
    const body = await res.text()
    t.is(res.status, 200)
    t.regex(body, /@rspack\/dev-server\/client/)
  } finally {
    await server.kill()
  }
})

test.serial('dev.overlay false disables the runtime overlays', async (t) => {
  const port = await getFreePort()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-dev-overlay-off-'))
  await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: 'dev-overlay-off', main: 'index.js' }))
  await fs.writeFile(path.join(dir, 'index.js'), 'document.querySelector("#root").textContent = "loaded";\n')
  await fs.writeFile(path.join(dir, 'jetpack.config.mjs'), 'export default { dev: { overlay: false } }\n')

  const server = await startJetpack(
    ['dev', '--dir', dir, '--host', '127.0.0.1', '--port', String(port), '--log=info'],
    {
      readyMatcher: new RegExp(`Asset server http://127\\.0\\.0\\.1:${port}`)
    }
  )

  try {
    const res = await fetch(`http://127.0.0.1:${port}/assets/bundle.js`)
    const body = await res.text()
    t.is(res.status, 200)
    t.regex(body, /@rspack\/dev-server\/client/)
    t.regex(body, /overlay=false/)
    t.notRegex(body, /lib\/overlay\/client\.js/)
    t.notRegex(body, /__jetpack\/overlay-events/)
  } finally {
    await server.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('dev injects Jetpack runtime overlay and resolves original source frames', async (t) => {
  const port = await getFreePort()
  const server = await startDevOnHost('pkg-basic', port)
  try {
    const htmlRes = await fetch(`http://127.0.0.1:${port}/`)
    const html = await htmlRes.text()
    const bundleRes = await fetch(`http://127.0.0.1:${port}/assets/bundle.js`)
    const bundle = await bundleRes.text()
    const generatedLine = bundle.split('\n').findIndex((line) => line.includes("document.querySelector('#root')")) + 1

    t.is(htmlRes.status, 200)
    t.regex(html, /<script src="\/assets\/bundle\.js" crossorigin="anonymous" defer><\/script>/)
    t.is(bundleRes.status, 200)
    t.true(generatedLine > 0)
    t.regex(bundle, /lib\/overlay\/client\.js/)
    t.regex(bundle, /connectBuildEvents/)
    t.regex(bundle, /pagehide/)
    t.regex(bundle, /beforeunload/)
    t.regex(bundle, /isBundlerMissingModuleError/)
    t.regex(bundle, /overlay=false/)
    t.notRegex(bundle, /require\("core-js\/modules\/es\.iterator/)

    const frameRes = await fetch(`http://127.0.0.1:${port}/__jetpack/error-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Error',
        message: 'Test',
        stack: `Error: Test\n    at main (http://127.0.0.1:${port}/assets/bundle.js:${generatedLine}:5)`,
        frames: [
          {
            methodName: 'main',
            url: `http://127.0.0.1:${port}/assets/bundle.js`,
            line: generatedLine,
            column: 5
          }
        ]
      })
    })
    const frame = await frameRes.json()

    t.is(frameRes.status, 200)
    t.is(frame.primaryFrame.source.file, 'pkg-basic/index.js')
    t.is(frame.codeFrame.file, 'pkg-basic/index.js')
    t.true(
      frame.codeFrame.lines.some((line) => line.highlight && line.value.includes("document.querySelector('#root')"))
    )
  } finally {
    await server.kill()
  }
})

test.serial('dev sends build errors to the Jetpack overlay event stream', async (t) => {
  const port = await getFreePort()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-dev-build-error-'))
  await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: 'dev-build-error', main: 'index.js' }))
  await fs.writeFile(
    path.join(dir, 'index.js'),
    ['import "missing-test-package";', 'document.querySelector("#root").textContent = "loaded";'].join('\n')
  )

  const server = await startJetpack(
    ['dev', '--dir', dir, '--host', '127.0.0.1', '--port', String(port), '--log=info'],
    {
      readyMatcher: new RegExp(`Asset server http://127\\.0\\.0\\.1:${port}`)
    }
  )

  try {
    const event = await readOverlayEvent(`http://127.0.0.1:${port}/__jetpack/overlay-events`)

    t.is(event.type, 'build-error')
    t.is(event.label, 'Build Error')
    t.regex(event.message, /missing-test-package/)
    t.truthy(event.codeFrame)
    t.is(event.codeFrame.file, './index.js')
    t.is(event.codeFrame.line, 1)
    t.true(event.codeFrame.lines.some((line) => line.highlight && line.value.includes('missing-test-package')))
  } finally {
    await server.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('dev preserves multiple build errors for overlay pagination', async (t) => {
  const port = await getFreePort()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-dev-multi-error-'))
  await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: 'dev-multi-error', main: 'index.js' }))
  await fs.writeFile(
    path.join(dir, 'index.js'),
    [
      'import "./missing-a.js";',
      'import "./missing-b.js";',
      'document.querySelector("#root").textContent = "loaded";'
    ].join('\n')
  )

  const server = await startJetpack(
    ['dev', '--dir', dir, '--host', '127.0.0.1', '--port', String(port), '--log=info'],
    {
      readyMatcher: new RegExp(`Asset server http://127\\.0\\.0\\.1:${port}`)
    }
  )

  try {
    const event = await readOverlayEvent(`http://127.0.0.1:${port}/__jetpack/overlay-events`)

    t.is(event.type, 'build-error')
    t.is(event.errors.length, 2)
    t.regex(event.errors[0].message, /missing-a/)
    t.regex(event.errors[1].message, /missing-b/)
    t.is(event.errors[0].codeFrame.line, 1)
    t.is(event.errors[1].codeFrame.line, 2)
  } finally {
    await server.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test('dev build errors synthesize source frames when Rspack omits formatted code', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-dev-plain-build-error-'))
  await fs.writeFile(
    path.join(dir, 'index.js'),
    ['import "missing-test-package";', 'document.querySelector("#root").textContent = "loaded";'].join('\n')
  )

  try {
    const event = createBuildErrorMessage(
      [
        {
          message: `Module not found: Can't resolve 'missing-test-package' in '${dir}'`,
          moduleName: './index.js'
        }
      ],
      { dir }
    )

    t.truthy(event.codeFrame)
    t.is(event.codeFrame.file, './index.js')
    t.is(event.codeFrame.line, 1)
    t.true(event.codeFrame.lines.some((line) => line.highlight && line.value.includes('missing-test-package')))
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('dev converts SWC syntax errors into compact overlay code frames', async (t) => {
  const port = await getFreePort()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-dev-syntax-error-'))
  await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: 'dev-syntax-error', main: 'index.js' }))
  await fs.writeFile(
    path.join(dir, 'index.js'),
    ['function broken() {', '  const value =', '}', 'document.querySelector("#root").textContent = broken();'].join(
      '\n'
    )
  )

  const server = await startJetpack(
    ['dev', '--dir', dir, '--host', '127.0.0.1', '--port', String(port), '--log=info'],
    {
      readyMatcher: new RegExp(`Asset server http://127\\.0\\.0\\.1:${port}`)
    }
  )

  try {
    const event = await readOverlayEvent(`http://127.0.0.1:${port}/__jetpack/overlay-events`)

    t.is(event.type, 'build-error')
    t.regex(event.message, /Expression expected/)
    t.truthy(event.codeFrame)
    t.is(event.codeFrame.file, './index.js')
    t.is(event.codeFrame.line, 3)
    t.true(event.codeFrame.lines.some((line) => line.highlight && line.value === '}'))
    t.notRegex(event.stack, /Cannot find module/)
  } finally {
    await server.kill()
    await fs.rm(dir, { recursive: true, force: true })
  }
})
