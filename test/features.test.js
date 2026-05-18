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

test('--print-config --legacy prints the legacy config', async (t) => {
  const result = await runJetpack(['build', '--print-config', '--legacy', '--dir', path.join(fixturesDir, 'pkg-basic')])
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
  const dir = await setupSplittingFixture({ chunkLoadRetry: true, minify: false })
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
  const dir = await setupSplittingFixture({ minify: false })
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
