import test from 'ava'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import options from '../lib/options.js'
import publicOptions, { resolveOptions } from '../options.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = (...subdir) => path.join(__dirname, ...subdir)

const base = (pkg, extra = {}) =>
  Object.assign(
    {
      production: false,
      logLevels: { info: false, progress: false, none: false },
      dir: dir('fixtures', pkg),
      assets: { js: ['/assets/bundle.js'], css: [], other: [], runtime: [] },
      runtime: null,
      entry: '.',
      dist: 'dist',
      target: {
        modern: true,
        legacy: false
      },
      react: false,
      hot: { enabled: true, quiet: false },
      port: 3030,
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
      port: 2800
    }
  })
  t.deepEqual(
    opts,
    base('pkg-swoosh', {
      hot: { enabled: false, quiet: false },
      entry: './some/path',
      port: 2800
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

test('public options export resolves without cli parsing', async (t) => {
  const opts = await publicOptions({ command: 'dev', dir: dir('fixtures', 'pkg-src') })
  const namedOpts = await resolveOptions({ command: 'dev', dir: dir('fixtures', 'pkg-src') })
  t.deepEqual(opts, namedOpts)
})
