module.exports = {
  port: 3999,
  entry: './app/client',
  exec: 'node ./app/server',
  proxy: {
    '/api/*': 'http://localhost:3000'
  }
}
