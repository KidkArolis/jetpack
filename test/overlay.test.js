import test from 'ava'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { createErrorFrameHandler } from '../lib/overlay/sourceMap.js'
import { parseStack } from '../lib/overlay/stack.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('overlay parses Chrome and Firefox stack frames consistently', (t) => {
  t.deepEqual(
    parseStack(`Error: test
    at render (http://localhost/assets/bundle.js:10:20)
    at http://localhost/assets/bundle.js:11:21
load@http://localhost/assets/bundle.js:12:22`),
    [
      {
        methodName: 'render',
        url: 'http://localhost/assets/bundle.js',
        line: 10,
        column: 20
      },
      {
        methodName: '<anonymous>',
        url: 'http://localhost/assets/bundle.js',
        line: 11,
        column: 21
      },
      {
        methodName: 'load',
        url: 'http://localhost/assets/bundle.js',
        line: 12,
        column: 22
      }
    ]
  )
})

test('runtime overlay ignores stale source-frame responses', async (t) => {
  const elements = new Map()
  const requests = []
  const appendElement = (element) => elements.set(element.id, element)
  const document = {
    currentScript: { src: 'http://localhost/assets/bundle.js' },
    head: {
      appendChild: appendElement
    },
    documentElement: {
      appendChild: appendElement
    },
    createElement() {
      return {
        id: '',
        innerHTML: '',
        textContent: '',
        querySelector() {
          return null
        }
      }
    },
    getElementById(id) {
      return elements.get(id) || null
    },
    querySelector() {
      return null
    }
  }
  const context = {
    URL,
    clearTimeout,
    console,
    document,
    fetch() {
      return new Promise((resolve) => requests.push(resolve))
    },
    navigator: {},
    parseStack,
    setTimeout,
    window: {
      addEventListener() {},
      location: { href: 'http://localhost/' }
    }
  }
  const clientPath = path.join(__dirname, '..', 'lib', 'overlay', 'client.js')
  const clientSource = (await fs.readFile(clientPath, 'utf8')).replace(
    "import { parseStack } from './stack.js'\n\n",
    ''
  )
  const source = `${clientSource}\nglobalThis.showRuntimeErrorForTest = showRuntimeError\n`
  vm.runInNewContext(source, context)

  const first = new Error('first')
  first.stack = 'Error: first\n    at first (http://localhost/assets/bundle.js:1:1)'
  const second = new Error('second')
  second.stack = 'Error: second\n    at second (http://localhost/assets/bundle.js:2:1)'

  context.showRuntimeErrorForTest(first)
  context.showRuntimeErrorForTest(second)
  t.is(requests.length, 2)

  requests[0]({
    ok: true,
    json: async () => ({ name: 'Error', message: 'mapped first', stack: first.stack, frames: [] })
  })
  await new Promise((resolve) => setImmediate(resolve))

  const overlay = elements.get('jetpack-error-overlay')
  t.true(overlay.innerHTML.includes('second'))
  t.false(overlay.innerHTML.includes('mapped first'))

  requests[1]({
    ok: true,
    json: async () => ({ name: 'Error', message: 'mapped second', stack: second.stack, frames: [] })
  })
  await new Promise((resolve) => setImmediate(resolve))

  t.true(overlay.innerHTML.includes('mapped second'))
})

test('runtime overlay does not read source files outside the project root', async (t) => {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-overlay-'))
  const dir = path.join(parent, 'app')
  const outsideFile = path.join(parent, 'app-secret.js')
  await fs.mkdir(dir)
  await fs.writeFile(outsideFile, 'globalThis.secret = true\n')

  const sourceMap = JSON.stringify({
    version: 3,
    file: 'bundle.js',
    sources: ['../app-secret.js'],
    sourcesContent: [null],
    names: [],
    mappings: 'AAAA'
  })
  const handler = createErrorFrameHandler({
    compiler: {
      outputFileSystem: {
        readFileSync() {
          return sourceMap
        }
      }
    },
    options: {
      dir,
      assetBasePathname: '/assets/',
      build: { outDir: 'dist' }
    }
  })
  let response

  try {
    await handler(
      {
        body: {
          name: 'Error',
          message: 'test',
          frames: [
            {
              methodName: 'main',
              url: 'http://localhost/assets/bundle.js',
              line: 1,
              column: 1
            }
          ]
        }
      },
      {
        json(value) {
          response = value
        }
      }
    )

    t.is(response.primaryFrame.source.file, '../app-secret.js')
    t.is(response.primaryFrame.source.content, null)
    t.is(response.codeFrame, null)
  } finally {
    await fs.rm(parent, { recursive: true, force: true })
  }
})
