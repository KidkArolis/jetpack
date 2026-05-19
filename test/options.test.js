import test from 'ava'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import options from '../lib/options.js'

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
      static: 'assets',
      target: {
        modern: true,
        legacy: false
      },
      react: false,
      hot: { enabled: true, quiet: false },
      port: 3030,
      sourceMaps: 'source-map',
      title: 'jetpack',
      body: "<div id='root'></div>",
      html: fs.readFileSync(path.join(__dirname, '..', 'lib', 'template.hbs')).toString(),
      head: null,
      proxy: {},
      minify: true,
      chunkLoadRetry: false,
      coverage: false,
      publicPath: '/assets/',
      publicPathName: '/assets/',
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
  const args = { flags: { dir: dir('fixtures', 'pkg-swoosh') } }
  const opts = await options('dev', args)
  t.deepEqual(opts, base('pkg-swoosh'))
})

test('accepts cli flags', async (t) => {
  const args = {
    entry: 'some/path',
    flags: {
      dir: dir('fixtures', 'pkg-swoosh'),
      hot: false,
      port: 2800
    }
  }
  const opts = await options('dev', args)
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
  const args = {
    entry: './module.js',
    flags: { dir: dir('fixtures', 'pkg-individual') }
  }
  const opts = await options('dev', args)
  t.deepEqual(
    opts,
    base('pkg-individual', {
      entry: './module.js'
    })
  )
})

test('defaults to . — rspack resolves via package.json main', async (t) => {
  // pkg-src has package.json with "main": "src/index.js"
  const args = { flags: { dir: dir('fixtures', 'pkg-src') } }
  const opts = await options('dev', args)
  t.deepEqual(opts, base('pkg-src', { title: 'pkg-src' }))
})

test('positional `.` is preserved', async (t) => {
  const args = { entry: '.', flags: { dir: dir('fixtures', 'pkg-src') } }
  const opts = await options('dev', args)
  t.is(opts.entry, '.')
})

test('positional `./` is preserved', async (t) => {
  const args = { entry: './', flags: { dir: dir('fixtures', 'pkg-src') } }
  const opts = await options('dev', args)
  t.is(opts.entry, './')
})

test('creates options object from jetpack.config.js', async (t) => {
  const args = {
    flags: {
      log: 'info',
      dir: dir('fixtures', 'pkg-with-config')
    }
  }
  const opts = await options('dev', args)
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
