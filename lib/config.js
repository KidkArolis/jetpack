const fs = require('fs')
const path = require('path')

module.exports = function config () {
  const configPath = path.join(process.cwd(), './jetpack.config.js')

  let exists = false
  try {
    exists = fs.lstatSync(configPath)
  } catch (err) {}

  let c

  if (exists) {
    c = require(configPath)
  }

  c = {}

  return Object.assign({
    client: './client',
    server: './server',
    static: './static',
    port: 3000,
    jsx: 'h'
  }, c)
}
