import test from 'ava'
const fs = require('fs')
const path = require('path')
const options = require('../lib/options')

const dir = (...subdir) => path.join(__dirname, ...subdir)

const base = (pkg, extra = {}) => Object.assign({
  production: false,
  pkg: { name: 'jetpack' },
  cmd: 'dev',
  dir: dir('fixtures', pkg),
  assets: { js: ['/client/bundle.js'], css: [], other: [], runtime: null },
  entry: '.',
  dist: 'dist',
  static: 'static',
  jsx: 'h',
  port: 3030,
  sourceMaps: 'source-map',
  title: 'jetpack',
  body: "<div id='root'></div>",
  html: fs.readFileSync(path.join(__dirname, '..', 'lib', 'template.ejs')).toString(),
  head: null,
  exec: false,
  proxy: {},
  browsers: [
    '>1%',
    'last 4 versions',
    'Firefox ESR',
    'not ie < 9'
  ],
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
    entry: 'some/path',
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

test('defaults to ./app if available', t => {
  const program = { args: [], dir: dir('fixtures', 'pkg-app') }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-app', {
    entry: './app'
  }))
})

test('creates options object from jetpack.config.js', t => {
  const program = { args: [], exec: true, dir: dir('fixtures', 'pkg-with-config') }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-with-config', {
    port: 1234,
    verbose: true,
    entry: './app/client',
    exec: 'node ./app/server',
    browsers: [
      'latest'
    ],
    css: {
      modules: false,
      features: {
        'nesting-rules': true
      }
    }
  }))
})
