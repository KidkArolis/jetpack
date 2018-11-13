module.exports = {
  port: 1234,
  entry: './app/client',
  exec: 'node ./app/server',
  verbose: true,
  css: {
    features: {
      'nesting-rules': true
    }
  }
}
