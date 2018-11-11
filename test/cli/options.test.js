import test from 'ava'
const fs = require('fs')
const path = require('path')
const options = require('../../lib/options')

const dir = (...subdir) => path.join(__dirname, '..', ...subdir)

const base = (pkg, extra = {}) => Object.assign({
  env: 'test',
  cmd: 'dev',
  owd: dir('fixtures', pkg),
  dir: dir('fixtures', pkg),
  assets: { js: ['/client/bundle.js'], css: [], other: [], runtime: null },
  client: '.',
  dist: 'dist',
  static: 'static',
  jsx: 'h',
  port: 3030,
  title: 'jetpack',
  body: "<div id='root'></div>",
  html: fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'template.ejs')).toString(),
  head: false,
  pkg: { name: 'jetpack' },
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

test.afterEach(() => {
  process.chdir(dir('..'))
})

test.serial('creates options object from cli args and jetpack.config.js', t => {
  process.chdir(dir('fixtures', 'pkg-swoosh'))
  const program = { args: [] }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-swoosh'))
})

test.serial('handles custom options', t => {
  process.chdir(dir('fixtures', 'pkg-swoosh'))
  const program = {
    args: ['some/path'],
    hot: false,
    port: 2800,
    jsx: 'React.createElement',
    static: 'public'
  }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-swoosh', {
    hot: false,
    client: 'some/path',
    port: 2800,
    jsx: 'React.createElement',
    static: 'public'
  }))
})

test.serial('handles an individual js module as an entry', t => {
  process.chdir(dir('fixtures', 'pkg-individual'))
  const program = { args: ['./module.js'] }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-individual', {
    client: './module.js'
  }))
})

test.serial('handles projects that have both client and server', t => {
  process.chdir(dir('fixtures', 'pkg-client-server'))
  const program = { server: 'node ./server', args: ['.'] }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-client-server', {
    client: './client',
    server: 'node ./server'
  }))
})

test.serial('handles projects that have both client and server in app', t => {
  process.chdir(dir('fixtures', 'pkg-app-client-server'))
  const program = { server: 'node ./app/server', args: ['.'] }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-app-client-server', {
    client: './app/client',
    server: 'node ./app/server'
  }))
})

test.serial('handles projects that have both client and server in different target dir', t => {
  process.chdir(dir('fixtures', 'pkg-swoosh'))
  const program = { server: 'node ./server', args: ['../pkg-client-server'] }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-client-server', {
    owd: dir('fixtures', 'pkg-swoosh'),
    client: './client',
    server: 'node ./server'
  }))
})

test.serial('handles projects that only have client dir', t => {
  process.chdir(dir('fixtures', 'pkg-swoosh'))
  const program = { args: ['../pkg-client'] }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-client', {
    owd: dir('fixtures', 'pkg-swoosh'),
    client: './client'
  }))
})

test.serial('handles custom client and server path', t => {
  process.chdir(dir('fixtures', 'pkg-swoosh'))
  const program = {
    args: ['../pkg-custom-client-server'],
    client: dir('fixtures', 'pkg-custom-client-server', 'my-client'),
    server: 'node ../pkg-custom-client-server/my-server'
  }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-custom-client-server', {
    owd: dir('fixtures', 'pkg-swoosh'),
    client: dir('fixtures', 'pkg-custom-client-server', './my-client'),
    server: 'node ../pkg-custom-client-server/my-server'
  }))
})

test.serial('creates options object from jetpack.config.js', t => {
  process.chdir(dir('fixtures', 'pkg-with-config'))
  const program = { args: [] }
  const opts = options('dev', program)
  t.deepEqual(opts, base('pkg-with-config', {
    port: 1234,
    verbose: true,
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
