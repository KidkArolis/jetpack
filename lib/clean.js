const fs = require('fs-extra')
const path = require('path')
const Confirm = require('prompt-confirm')

module.exports = function clean (options) {
  const target = path.join(options.dir, options.dist)
  const prompt = new Confirm(`Do you want to remove ${target}?`)
  prompt.ask(async function (answer) {
    await fs.remove(target)
  })
}
