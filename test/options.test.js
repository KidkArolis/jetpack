import test from 'ava'
const fs = require('fs')
const path = require('path')
const options = require('../lib/options')

const dir = (...subdir) => path.join(__dirname, ...subdir)

const base = (pkg, extra = {}) => Object.assign({
  production: false,
  dir: dir('fixtures', pkg),
  assets: { js: ['/assets/bundle.js'], css: [], other: [], runtime: null },
  entry: '.',
  dist: 'dist',
  static: 'assets',
  target: {
    modern: true,
    legacy: false
  },
  jsx: 'h',
  hot: true,
  port: 3030,
  sourceMaps: 'source-map',
  title: 'jetpack',
  body: "<div id='root'></div>",
  html: fs.readFileSync(path.join(__dirname, '..', 'lib', 'template.hbs')).toString(),
  head: null,
  exec: false,
  proxy: {},
  minify: true,
  coverage: false,
  css: {
    modules: false,
    features: {}
  }
}, extra)

test('creates options object from cli flags and jetpack.config.js', t => {
  const program = { args: [], dir: dir('fixtures', 'pkg-swoosh') }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-swoosh'))
})

test('accepts cli flags', t => {
  const program = {
    args: ['some/path'],
    dir: dir('fixtures', 'pkg-swoosh'),
    hot: false,
    port: 2800,
    jsx: 'React.createElement'
  }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-swoosh', {
    hot: false,
    entry: './some/path',
    port: 2800,
    jsx: 'React.createElement'
  }))
})

test('accepts individual js module as entry', t => {
  const program = { args: ['./module.js'], dir: dir('fixtures', 'pkg-individual') }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-individual', {
    entry: './module.js'
  }))
})

test('defaults to ./src if available', t => {
  const program = { args: [], dir: dir('fixtures', 'pkg-src') }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-src', {
    entry: './src'
  }))
})

test('creates options object from jetpack.config.js', t => {
  const program = { args: [], exec: true, dir: dir('fixtures', 'pkg-with-config') }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-with-config', {
    port: 1234,
    verbose: true,
    title: 'testing',
    entry: './app/client',
    exec: 'node ./app/server',
    css: {
      modules: false,
      features: {
        'nesting-rules': true
      }
    }
  }))
})
