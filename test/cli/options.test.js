const fs = require('fs')
const path = require('path')
const assert = require('assert')
const options = require('../../lib/options')

const dir = (...subdir) => path.join(__dirname, '..', ...subdir)

const base = (pkg, extra = {}) => Object.assign({
  env: 'development',
  cmd: 'dev',
  owd: dir('fixtures', pkg),
  dir: dir('fixtures', pkg),
  assets: { js: ['/client/bundle.js'], css: [], other: [] },
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

describe('options', () => {
  afterEach(() => {
    process.chdir(dir('..'))
  })

  it('creates options object from cli args and jetpack.config.js', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: [] }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-swoosh'))
  })

  it('handles custom options', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = {
      args: ['some/path'],
      hot: false,
      port: 2800,
      jsx: 'React.createElement',
      static: 'public'
    }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-swoosh', {
      hot: false,
      client: 'some/path',
      port: 2800,
      jsx: 'React.createElement',
      static: 'public'
    }))
  })

  it('handles an individual js module as an entry', () => {
    process.chdir(dir('fixtures', 'pkg-individual'))
    const program = { args: ['./module.js'] }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-individual', {
      client: './module.js'
    }))
  })

  it('handles projects that have both client and server', () => {
    process.chdir(dir('fixtures', 'pkg-client-server'))
    const program = { server: 'node ./server', args: ['.'] }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-client-server', {
      client: './client',
      server: 'node ./server'
    }))
  })

  it('handles projects that have both client and server in app', () => {
    process.chdir(dir('fixtures', 'pkg-app-client-server'))
    const program = { server: 'node ./app/server', args: ['.'] }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-app-client-server', {
      client: './app/client',
      server: 'node ./app/server'
    }))
  })

  it('handles projects that have both client and server in different target dir', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { server: 'node ./server', args: ['../pkg-client-server'] }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-client-server', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: './client',
      server: 'node ./server'
    }))
  })

  it('handles projects that only have client dir', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: ['../pkg-client'] }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-client', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: './client'
    }))
  })

  it('handles custom client and server path', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = {
      args: ['../pkg-custom-client-server'],
      client: dir('fixtures', 'pkg-custom-client-server', 'my-client'),
      server: 'node ../pkg-custom-client-server/my-server'
    }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-custom-client-server', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: dir('fixtures', 'pkg-custom-client-server', './my-client'),
      server: 'node ../pkg-custom-client-server/my-server'
    }))
  })

  it('creates options object from jetpack.config.js', () => {
    process.chdir(dir('fixtures', 'pkg-with-config'))
    const program = { args: [] }
    const opts = options('dev', program)
    assert.deepStrictEqual(opts, base('pkg-with-config', {
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
})
