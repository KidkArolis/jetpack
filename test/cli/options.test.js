const path = require('path')
const assert = require('assert')
const options = require('../../lib/cli/options')

const dir = (...subdir) => path.join(__dirname, '..', ...subdir)

const base = (pkg, extra = {}) => Object.assign({
  env: 'development',
  cmd: 'dev',
  owd: dir('fixtures', pkg),
  dir: dir('fixtures', pkg),
  assets: ['/client/bundle.js'],
  client: '.',
  clientDisabled: false,
  server: null,
  serverDisabled: false,
  dist: 'dist',
  static: 'static',
  jsx: 'h',
  port: 3000,
  pkg: { name: 'jetpack' }
}, extra)

describe('options', () => {
  afterEach(() => {
    process.chdir(dir('..'))
  })

  it('creates options object from cli args and jetpack.config.js', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: [] }
    const opts = options('dev', program)
    assert.deepEqual(opts, base('pkg-swoosh'))
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
    assert.deepEqual(opts, base('pkg-swoosh', {
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
    assert.deepEqual(opts, base('pkg-individual', {
      client: './module.js'
    }))
  })

  it('handles projects that have both client and server', () => {
    process.chdir(dir('fixtures', 'pkg-client-server'))
    const program = { args: ['.'] }
    const opts = options('dev', program)
    assert.deepEqual(opts, base('pkg-client-server', {
      client: './client',
      server: './server'
    }))
  })

  it('handles projects that have both client and server in different target dir', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: ['../pkg-client-server'] }
    const opts = options('dev', program)
    assert.deepEqual(opts, base('pkg-client-server', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: './client',
      server: './server'
    }))
  })

  it('handles projects that only have client dir', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: ['../pkg-client'] }
    const opts = options('dev', program)
    assert.deepEqual(opts, base('pkg-client', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: './client',
      server: null
    }))
  })

  it('handles projects that only have server dir', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: ['../pkg-server'] }
    const opts = options('dev', program)
    assert.deepEqual(opts, base('pkg-server', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: '.',
      server: './server'
    }))
  })

  it('handles custom client and server path', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = {
      args: ['../pkg-custom-client-server'],
      client: dir('fixtures', 'pkg-custom-client-server', 'my-client'),
      server: '../pkg-custom-client-server/my-server'
    }
    const opts = options('dev', program)
    assert.deepEqual(opts, base('pkg-custom-client-server', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: dir('fixtures', 'pkg-custom-client-server', './my-client'),
      server: '../pkg-custom-client-server/my-server'
    }))
  })
})
