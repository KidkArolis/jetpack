module.exports = {
  port: 1234,
  entry: './app/client',
  title: 'testing',
  exec: 'node ./app/server',
  verbose: true,
  css: {
    features: {
      'nesting-rules': true
    }
  }
}
