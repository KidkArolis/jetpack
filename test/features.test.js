import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { runJetpack } from './helpers/process.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

async function setupTmpFixture(fixture, config) {
  const src = path.join(fixturesDir, fixture)
  const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-features-'))
  await fs.cp(src, dest, { recursive: true, filter: (s) => !s.includes(`${path.sep}dist`) })
  if (config) {
    await fs.writeFile(path.join(dest, 'jetpack.config.mjs'), `export default ${JSON.stringify(config, null, 2)}\n`)
  }
  return dest
}

// strips ANSI colour codes so regexes don't need to account for them
function stripAnsi(s) {
  return s.replace(/\[[0-9;]*m/g, '')
}

test('--print-config prints the rspack config to stdout', async (t) => {
  const result = await runJetpack(['build', '--print-config', '--dir', path.join(fixturesDir, 'pkg-basic')])
  t.is(result.exitCode, 0)
  const out = stripAnsi(result.stdout)
  t.regex(out, /Modern config/)
  t.regex(out, /target:\s*\[\s*'web'/)
  t.regex(out, /entry:\s*\{/)
  t.regex(out, /mode:\s*'production'/)
  t.regex(out, /assetModuleFilename:/)
})

test('--print-config --target=legacy prints the legacy config', async (t) => {
  const result = await runJetpack([
    'build',
    '--print-config',
    '--target=legacy',
    '--dir',
    path.join(fixturesDir, 'pkg-basic')
  ])
  t.is(result.exitCode, 0)
  const out = stripAnsi(result.stdout)
  t.regex(out, /Legacy config/)
  t.regex(out, /\[name\]\.\[contenthash\]\.legacy\.js/)
})

test('production build has no source maps by default', async (t) => {
  const result = await runJetpack(['build', '--print-config', '--dir', path.join(fixturesDir, 'pkg-basic')])
  t.is(result.exitCode, 0)
  t.regex(stripAnsi(result.stdout), /devtool:\s*undefined/)
})

test('dev mode includes source-map devtool', async (t) => {
  // dev is the default command, no positional needed
  const result = await runJetpack(['--print-config', '--dir', path.join(fixturesDir, 'pkg-basic')])
  t.is(result.exitCode, 0)
  t.regex(stripAnsi(result.stdout), /devtool:\s*'source-map'/)
})

test.serial('build uses Jetpack browser defaults when no browserslist config exists', async (t) => {
  const dir = await setupTmpFixture('pkg-src')

  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0, `build failed: ${build.all}`)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

// Sets up a fixture that has a dynamic import (so a chunk gets created and the
// RetryChunkLoadPlugin's runtime injection can actually run).
async function setupSplittingFixture(config) {
  const dir = await setupTmpFixture('pkg-basic', config)
  await fs.writeFile(path.join(dir, 'more.js'), `export const more = () => 'more'\n`)
  await fs.writeFile(
    path.join(dir, 'index.js'),
    `import('./more.js').then(({ more }) => { document.querySelector('#root').innerHTML = more() })\n`
  )
  return dir
}

test.serial('chunkLoadRetry: true injects retry runtime into bundle', async (t) => {
  const dir = await setupSplittingFixture({ build: { chunkLoadRetry: true, minify: false } })
  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0, `build failed: ${build.all}`)
    const assetsDir = path.join(dir, 'dist', 'assets')
    const files = await fs.readdir(assetsDir)
    const runtimeFile = files.find((f) => f.startsWith('runtime~bundle.') && f.endsWith('.js'))
    t.truthy(runtimeFile, 'runtime bundle should exist')
    const runtime = await fs.readFile(path.join(assetsDir, runtimeFile), 'utf8')
    // RetryChunkLoadPlugin wraps ensureChunk with attempt/backoff logic
    t.regex(runtime, /attemptCount/)
    t.regex(runtime, /initialEnsureChunk/)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('chunkLoadRetry default (false) does not inject retry runtime', async (t) => {
  const dir = await setupSplittingFixture({ build: { minify: false } })
  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0)
    const assetsDir = path.join(dir, 'dist', 'assets')
    const files = await fs.readdir(assetsDir)
    const runtimeFile = files.find((f) => f.startsWith('runtime~bundle.') && f.endsWith('.js'))
    const runtime = await fs.readFile(path.join(assetsDir, runtimeFile), 'utf8')
    t.notRegex(runtime, /initialEnsureChunk/)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('define injects build-time constants', async (t) => {
  const dir = await setupTmpFixture('pkg-basic', {
    build: {
      minify: false
    },
    define: {
      __JETPACK_DEFINED__: 'custom-value',
      'process.env.RELEASE_ENV': 'staging'
    }
  })
  await fs.writeFile(
    path.join(dir, 'index.js'),
    `
      document.querySelector('#root').innerHTML = [
        __JETPACK_DEFINED__,
        process.env.RELEASE_ENV
      ].join(':')
    `
  )

  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0, `build failed: ${build.all}`)
    const assetsDir = path.join(dir, 'dist', 'assets')
    const files = await fs.readdir(assetsDir)
    const bundleFile = files.find((f) => f.startsWith('bundle.') && f.endsWith('.js'))
    const bundle = await fs.readFile(path.join(assetsDir, bundleFile), 'utf8')
    t.true(bundle.includes('"custom-value"'))
    t.true(bundle.includes('"staging"'))
    t.false(bundle.includes('__JETPACK_DEFINED__'))
    t.false(bundle.includes('process.env.RELEASE_ENV'))
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('assetBaseUrl controls generated html asset urls', async (t) => {
  const dir = await setupTmpFixture('pkg-basic', {
    assetBaseUrl: 'https://cdn.example.com/client-assets'
  })

  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0, `build failed: ${build.all}`)
    const index = await fs.readFile(path.join(dir, 'dist', 'index.html'), 'utf8')
    t.regex(index, /https:\/\/cdn\.example\.com\/client-assets\/bundle\..*\.css/)
    t.regex(index, /https:\/\/cdn\.example\.com\/client-assets\/bundle\..*\.js/)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('build writes an asset manifest', async (t) => {
  const dir = await setupTmpFixture('pkg-basic', {
    assetBaseUrl: 'https://cdn.example.com/client-assets'
  })

  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0, `build failed: ${build.all}`)
    const manifest = JSON.parse(await fs.readFile(path.join(dir, 'dist', 'manifest.json'), 'utf8'))
    t.regex(manifest.modern.js[0], /^https:\/\/cdn\.example\.com\/client-assets\/bundle\..*\.js$/)
    t.regex(manifest.modern.css[0], /^https:\/\/cdn\.example\.com\/client-assets\/bundle\..*\.css$/)
    t.deepEqual(manifest.modern.other, [])
    t.false('inlineRuntime' in manifest.modern)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})
