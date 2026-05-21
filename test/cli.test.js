import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { runJetpack } from './helpers/process.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

test('--version prints jetpack and rspack versions', async (t) => {
  const result = await runJetpack(['--version'])
  t.is(result.exitCode, 0)
  t.regex(result.stdout, /Jetpack \d+\.\d+\.\d+/)
  t.regex(result.stdout, /Rspack \d+\.\d+\.\d+/)
})

test('--help prints the usage banner', async (t) => {
  const result = await runJetpack(['--help'])
  t.is(result.exitCode, 0)
  t.regex(result.stdout, /Usage:\s*jetpack/)
  t.regex(result.stdout, /Commands:/)
  t.regex(result.stdout, /Options:/)
  t.regex(result.stdout, /--port/)
})

test('command help prints command-specific usage', async (t) => {
  const result = await runJetpack(['build', '--help'])
  t.is(result.exitCode, 0)
  t.regex(result.stdout, /Usage:\s*jetpack build/)
  t.regex(result.stdout, /--target/)
})

test('unknown bare commands fail', async (t) => {
  const result = await runJetpack(['buidl'])
  t.is(result.exitCode, 1)
  t.regex(result.stderr, /Unknown command "buidl"/)
})

test('extra positional arguments fail', async (t) => {
  const result = await runJetpack(['build', 'index.js', 'extra.js', '--dir', path.join(fixturesDir, 'pkg-basic')])
  t.is(result.exitCode, 1)
  t.regex(result.stderr, /Unexpected argument "extra.js"/)
})

test('--no-minify disables minification', async (t) => {
  const result = await runJetpack([
    'build',
    '--print-config',
    '--no-minify',
    '--dir',
    path.join(fixturesDir, 'pkg-basic')
  ])
  t.is(result.exitCode, 0)
  // minimizer array stays empty when --no-minify is passed
  t.regex(result.stdout.replace(/\[[0-9;]*m/g, ''), /minimizer:\s*\[\s*\]/)
})

test('--target controls the bundle target', async (t) => {
  const result = await runJetpack([
    'build',
    '--print-config',
    '--target=legacy',
    '--dir',
    path.join(fixturesDir, 'pkg-basic')
  ])
  t.is(result.exitCode, 0)
  const stdout = result.stdout.replace(/\[[0-9;]*m/g, '')
  t.regex(stdout, /Legacy config/)
  t.notRegex(stdout, /Modern config/)
})

test('--log=all enables info and progress logging', async (t) => {
  const result = await runJetpack([
    'build',
    '--print-config',
    '--log=all',
    '--dir',
    path.join(fixturesDir, 'pkg-basic')
  ])
  t.is(result.exitCode, 0)
  t.regex(result.stdout, /Building for production/)
})

test('invalid --target fails', async (t) => {
  const result = await runJetpack(['build', '--target=ancient', '--dir', path.join(fixturesDir, 'pkg-basic')])
  t.is(result.exitCode, 1)
  t.regex(result.stderr, /Invalid target "ancient"/)
})

test('positional path is used as the entry', async (t) => {
  // pass `index.js` as a positional — should be picked up as entry
  const dir = path.join(fixturesDir, 'pkg-basic')
  const result = await runJetpack(['build', '--print-config', 'index.js', '--dir', dir])
  t.is(result.exitCode, 0)
  t.regex(result.stdout.replace(/\[[0-9;]*m/g, ''), /entry:\s*\{[^}]*bundle:\s*\[\s*'\.\/index\.js'\s*\]/)
})

test.serial('clean command via positional', async (t) => {
  // builds then runs `jetpack clean` via positional command
  const src = path.join(fixturesDir, 'pkg-basic')
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-cli-'))
  await fs.cp(src, dir, { recursive: true, filter: (s) => !s.includes(`${path.sep}dist`) })
  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0)
    const clean = await runJetpack(['clean', '--dir', dir], { input: 'y\n' })
    t.is(clean.exitCode, 0)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})
