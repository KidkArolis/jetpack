module.exports = {
  port: 1234,
  entry: './app/client',
  exec: 'node ./app/server',
  verbose: true,
  browsers: [
    'latest'
  ],
  css: {
    features: {
      'nesting-rules': true
    }
  }
}
