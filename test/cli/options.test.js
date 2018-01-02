const path = require('path')
const assert = require('assert')
const options = require('../../lib/cli/options')

const dir = (...subdir) => path.join(__dirname, '..', ...subdir)

const base = (pkg, extra = {}) => Object.assign({
  owd: dir('fixtures', pkg),
  dir: dir('fixtures', pkg),
  target: dir('fixtures', pkg),
  bundle: '/client/bundle.js',
  client: '.',
  server: false,
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
    const opts = options(program)
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
    const opts = options(program)
    assert.deepEqual(opts, base('pkg-swoosh', {
      hot: false,
      target: dir('fixtures', 'pkg-swoosh', 'some', 'path'),
      port: 2800,
      jsx: 'React.createElement',
      static: 'public'
    }))
  })

  it('handles an individual js module as an entry', () => {
    process.chdir(dir('fixtures', 'pkg-individual'))
    const program = { args: ['./module.js'] }
    const opts = options(program)
    assert.deepEqual(opts, base('pkg-individual', {
      target: dir('fixtures', 'pkg-individual', 'module.js')
    }))
  })

  it('handles projects that have both client and server', () => {
    process.chdir(dir('fixtures', 'pkg-client-server'))
    const program = { args: ['.'] }
    const opts = options(program)
    assert.deepEqual(opts, base('pkg-client-server', {
      client: dir('fixtures', 'pkg-client-server', 'client'),
      server: dir('fixtures', 'pkg-client-server', 'server')
    }))
  })

  it('handles projects that have both client and server in different target dir', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: ['../pkg-client-server'] }
    const opts = options(program)
    assert.deepEqual(opts, base('pkg-client-server', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: dir('fixtures', 'pkg-client-server', 'client'),
      server: dir('fixtures', 'pkg-client-server', 'server')
    }))
  })

  it('handles projects that only have client dir', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: ['../pkg-client'] }
    const opts = options(program)
    assert.deepEqual(opts, base('pkg-client', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: dir('fixtures', 'pkg-client', 'client'),
      server: false
    }))
  })

  it('handles projects that only have server dir', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = { args: ['../pkg-server'] }
    const opts = options(program)
    assert.deepEqual(opts, base('pkg-server', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: false,
      server: dir('fixtures', 'pkg-server', 'server')
    }))
  })

  it('handles custom client and server path', () => {
    process.chdir(dir('fixtures', 'pkg-swoosh'))
    const program = {
      args: ['../pkg-custom-client-server'],
      client: dir('fixtures', 'pkg-custom-client-server', 'my-client'),
      server: '../pkg-custom-client-server/my-server'
    }
    const opts = options(program)
    assert.deepEqual(opts, base('pkg-custom-client-server', {
      owd: dir('fixtures', 'pkg-swoosh'),
      client: dir('fixtures', 'pkg-custom-client-server', './my-client'),
      server: dir('fixtures', 'pkg-custom-client-server', './my-server')
    }))
  })
})

// if you point to a file - it will use that file as entry point
// if you point to a dir - it will use that dir as entry point
// but if the dir pointed at has client or server subdirs it will use those
