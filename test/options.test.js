const test = require('ava')
const fs = require('fs')
const path = require('path')
const options = require('../lib/options')

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
      exec: false,
      proxy: {},
      minify: true,
      chunkLoadRetry: false,
      coverage: false,
      publicPath: '/assets/',
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

test('creates options object from cli flags and jetpack.config.js', (t) => {
  const args = { flags: { dir: dir('fixtures', 'pkg-swoosh') } }
  const opts = options('dev', args)
  t.deepEqual(opts, base('pkg-swoosh'))
})

test('accepts cli flags', (t) => {
  const args = {
    entry: 'some/path',
    flags: {
      dir: dir('fixtures', 'pkg-swoosh'),
      hot: false,
      port: 2800
    }
  }
  const opts = options('dev', args)
  t.deepEqual(
    opts,
    base('pkg-swoosh', {
      hot: { enabled: false, quiet: false },
      entry: './some/path',
      port: 2800
    })
  )
})

test('accepts individual js module as entry', (t) => {
  const args = {
    entry: './module.js',
    flags: { dir: dir('fixtures', 'pkg-individual') }
  }
  const opts = options('dev', args)
  t.deepEqual(
    opts,
    base('pkg-individual', {
      entry: './module.js'
    })
  )
})

test('defaults to ./src if available', (t) => {
  const args = { flags: { dir: dir('fixtures', 'pkg-src') } }
  const opts = options('dev', args)
  t.deepEqual(
    opts,
    base('pkg-src', {
      entry: './src'
    })
  )
})

test('creates options object from jetpack.config.js', (t) => {
  const args = {
    flags: {
      exec: true,
      log: 'info',
      dir: dir('fixtures', 'pkg-with-config')
    }
  }
  const opts = options('dev', args)
  t.deepEqual(
    opts,
    base('pkg-with-config', {
      port: 1234,
      logLevels: { info: true, progress: false, none: false },
      title: 'testing',
      entry: './app/client',
      exec: 'node ./app/server',
      css: {
        modules: false,
        features: {
          'nesting-rules': true
        }
      }
    })
  )
})
