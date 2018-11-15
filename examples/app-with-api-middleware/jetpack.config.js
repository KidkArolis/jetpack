module.exports = {
  port: 3999,
  proxy: {
    '/api/*': 'http://localhost:3000'
  }
}
