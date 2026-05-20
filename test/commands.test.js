import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { runJetpack } from './helpers/process.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

async function setupTmpFixture(fixture) {
  const src = path.join(fixturesDir, fixture)
  const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-cmd-'))
  await fs.cp(src, dest, { recursive: true, filter: (s) => !s.includes(`${path.sep}dist`) })
  return dest
}

test('jetpack browsers prints modern browser info', async (t) => {
  const result = await runJetpack(['browsers', '--dir', path.join(fixturesDir, 'pkg-basic')])
  t.is(result.exitCode, 0)
  t.regex(result.stdout, /\[modern query\]/i)
  t.regex(result.stdout, /\[modern browsers\]/i)
  t.regex(result.stdout, /\[modern coverage globally\]/i)
})

test('jetpack browsers --coverage=US scopes coverage', async (t) => {
  const result = await runJetpack(['browsers', '--coverage=US', '--dir', path.join(fixturesDir, 'pkg-basic')])
  t.is(result.exitCode, 0)
  t.regex(result.stdout, /\[modern coverage US\]/i)
})

test('jetpack browsers --target=legacy prints legacy info', async (t) => {
  const result = await runJetpack(['browsers', '--target=legacy', '--dir', path.join(fixturesDir, 'pkg-basic')])
  t.is(result.exitCode, 0)
  t.regex(result.stdout, /\[legacy query\]/i)
  t.regex(result.stdout, /\[legacy browsers\]/i)
})

test.serial('jetpack clean removes dist when confirmed', async (t) => {
  const dir = await setupTmpFixture('pkg-basic')
  try {
    // build first so there's a dist to clean
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0, `build failed: ${build.all}`)
    t.true(existsSync(path.join(dir, 'dist')))

    const result = await runJetpack(['clean', '--dir', dir], { input: 'y\n' })
    t.is(result.exitCode, 0)
    t.false(existsSync(path.join(dir, 'dist')))
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack clean keeps dist when not confirmed', async (t) => {
  const dir = await setupTmpFixture('pkg-basic')
  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0)
    t.true(existsSync(path.join(dir, 'dist')))

    const result = await runJetpack(['clean', '--dir', dir], { input: 'n\n' })
    t.is(result.exitCode, 0)
    t.true(existsSync(path.join(dir, 'dist')), 'dist should still exist when user declines')
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack clean --yes removes dist without prompting', async (t) => {
  const dir = await setupTmpFixture('pkg-basic')
  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0)
    t.true(existsSync(path.join(dir, 'dist')))

    const result = await runJetpack(['clean', '--yes', '--dir', dir])
    t.is(result.exitCode, 0)
    t.false(existsSync(path.join(dir, 'dist')))
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack clean --dry-run keeps dist', async (t) => {
  const dir = await setupTmpFixture('pkg-basic')
  try {
    const build = await runJetpack(['build', '--log=info', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(build.exitCode, 0)
    t.true(existsSync(path.join(dir, 'dist')))

    const result = await runJetpack(['clean', '--dry-run', '--dir', dir])
    t.is(result.exitCode, 0)
    t.regex(result.stdout, /Would remove/)
    t.true(existsSync(path.join(dir, 'dist')))
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test.serial('jetpack inspect writes a self-contained treemap HTML', async (t) => {
  const dir = await setupTmpFixture('pkg-basic')
  try {
    const result = await runJetpack(['inspect', '--dir', dir], {
      cwd: os.tmpdir(),
      env: process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}
    })
    t.is(result.exitCode, 0, `inspect failed: ${result.all}`)
    t.regex(result.all, /Wrote dist\/inspect\.html/)

    const html = await fs.readFile(path.join(dir, 'dist', 'inspect.html'), 'utf8')
    t.regex(html, /<title>jetpack inspect/)
    // The d3-hierarchy bundle is inlined
    t.regex(html, /d3\.treemap/)
    // The bundle data is inlined and has at least one js asset
    t.regex(html, /"name":"bundle\..*\.js"/)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})
