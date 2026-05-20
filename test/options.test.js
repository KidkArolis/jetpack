import test from 'ava'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import options from '../lib/options.js'
import createRspackConfig from '../lib/rspack.config.js'
import { resolveConfig } from '../index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = (...subdir) => path.join(__dirname, ...subdir)

const base = (pkg, extra = {}) =>
  Object.assign(
    {
      command: 'dev',
      mode: 'development',
      logLevels: { info: false, progress: false, none: false },
      dir: dir('fixtures', pkg),
      entry: '.',
      outDir: 'dist',
      target: {
        modern: true,
        legacy: false
      },
      react: false,
      hot: { enabled: true, quiet: false },
      port: 3030,
      host: 'localhost',
      sourceMaps: 'source-map',
      title: 'jetpack',
      cspNonce: false,
      html: null,
      proxy: {},
      define: {},
      minify: true,
      chunkLoadRetry: false,
      coverage: false,
      assetBaseUrl: '/assets/',
      assetBasePathname: '/assets/',
      css: {
        modules: false,
        features: {
          include: null,
          exclude: null
        }
      }
    },
    extra
  )

test('creates options object from cli flags and jetpack.config.js', async (t) => {
  const opts = await options({ command: 'dev', dir: dir('fixtures', 'pkg-swoosh') })
  t.deepEqual(opts, base('pkg-swoosh'))
})

test('accepts explicit overrides', async (t) => {
  const opts = await options({
    command: 'dev',
    entry: 'some/path',
    dir: dir('fixtures', 'pkg-swoosh'),
    overrides: {
      hot: false,
      port: 2800,
      host: '127.0.0.1'
    }
  })
  t.deepEqual(
    opts,
    base('pkg-swoosh', {
      hot: { enabled: false, quiet: false },
      entry: './some/path',
      port: 2800,
      host: '127.0.0.1'
    })
  )
})

test('accepts individual js module as entry', async (t) => {
  const opts = await options({
    command: 'dev',
    entry: './module.js',
    dir: dir('fixtures', 'pkg-individual')
  })
  t.deepEqual(
    opts,
    base('pkg-individual', {
      entry: './module.js'
    })
  )
})

test('defaults to . — rspack resolves via package.json main', async (t) => {
  // pkg-src has package.json with "main": "src/index.js"
  const opts = await options({ command: 'dev', dir: dir('fixtures', 'pkg-src') })
  t.deepEqual(opts, base('pkg-src', { title: 'pkg-src' }))
})

test('positional `.` is preserved', async (t) => {
  const opts = await options({ command: 'dev', entry: '.', dir: dir('fixtures', 'pkg-src') })
  t.is(opts.entry, '.')
})

test('positional `./` is preserved', async (t) => {
  const opts = await options({ command: 'dev', entry: './', dir: dir('fixtures', 'pkg-src') })
  t.is(opts.entry, './')
})

test('creates options object from jetpack.config.js', async (t) => {
  const opts = await options({
    command: 'dev',
    dir: dir('fixtures', 'pkg-with-config'),
    overrides: {
      log: 'info'
    }
  })
  t.deepEqual(
    opts,
    base('pkg-with-config', {
      port: 1234,
      logLevels: { info: true, progress: false, none: false },
      title: 'testing',
      entry: './app/client',
      css: {
        modules: false,
        features: {
          'nesting-rules': true
        }
      }
    })
  )
})

test('normalizes assetBaseUrl and assetBasePathname', async (t) => {
  const opts = await options({
    command: 'dev',
    dir: dir('fixtures', 'pkg-src'),
    overrides: {},
    config: null
  })
  t.is(opts.assetBaseUrl, '/assets/')
  t.is(opts.assetBasePathname, '/assets/')
})

test('public config export resolves without cli parsing', async (t) => {
  const opts = await resolveConfig({ command: 'dev', dir: dir('fixtures', 'pkg-src') })
  const namedOpts = await options({ command: 'dev', dir: dir('fixtures', 'pkg-src') })
  t.deepEqual(opts, namedOpts)
})

test('accepts string targets', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    overrides: { target: 'all' }
  })
  t.deepEqual(opts.target, { modern: true, legacy: true })
})

test('accepts explicit mode independently of command', async (t) => {
  const opts = await options({
    command: 'build',
    mode: 'development',
    dir: dir('fixtures', 'pkg-src')
  })

  t.is(opts.command, 'build')
  t.is(opts.mode, 'development')
  t.is(opts.sourceMaps, 'source-map')
})

test('rejects invalid modes', async (t) => {
  await t.throwsAsync(
    options({
      command: 'build',
      mode: 'staging',
      dir: dir('fixtures', 'pkg-src')
    }),
    { message: 'Invalid mode "staging". Expected development or production.' }
  )
})

test('rejects invalid targets', async (t) => {
  await t.throwsAsync(
    options({
      command: 'build',
      dir: dir('fixtures', 'pkg-src'),
      overrides: { target: 'ancient' }
    }),
    { message: 'Invalid target "ancient". Expected modern, legacy, or all.' }
  )
})

test('rejects targets that do not apply to the command', async (t) => {
  await t.throwsAsync(
    options({
      command: 'dev',
      dir: dir('fixtures', 'pkg-src'),
      overrides: { target: 'all' }
    }),
    { message: 'Command "dev" only supports one target at a time. Use --target modern or --target legacy.' }
  )
})

test('rejects output paths that point at or outside the project root', async (t) => {
  const src = dir('fixtures', 'pkg-src')
  const projectRootDist = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-options-'))
  const outsideDist = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-options-'))
  await fs.cp(src, projectRootDist, { recursive: true })
  await fs.cp(src, outsideDist, { recursive: true })
  t.teardown(() => fs.rm(projectRootDist, { recursive: true, force: true }))
  t.teardown(() => fs.rm(outsideDist, { recursive: true, force: true }))

  await fs.writeFile(path.join(projectRootDist, 'jetpack.config.mjs'), 'export default { outDir: "." }\n')
  await t.throwsAsync(
    options({
      command: 'build',
      dir: projectRootDist
    }),
    { message: 'outDir must not point to the project root.' }
  )

  await fs.writeFile(path.join(outsideDist, 'jetpack.config.mjs'), 'export default { outDir: "../outside" }\n')
  await t.throwsAsync(
    options({
      command: 'build',
      dir: outsideDist
    }),
    { message: 'outDir must stay inside the project root.' }
  )
})

test('passes a small public context to the rspack hook', async (t) => {
  const contexts = []
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    overrides: {},
    config: null
  })

  createRspackConfig({
    ...opts,
    rspack(config, context) {
      contexts.push(context)
      return config
    }
  })

  t.deepEqual(contexts, [
    { command: 'build', mode: 'production', target: 'modern', dir: dir('fixtures', 'pkg-src') },
    { command: 'build', mode: 'production', target: 'legacy', dir: dir('fixtures', 'pkg-src') }
  ])
})
