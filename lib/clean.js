const fs = require('fs-extra')
const path = require('path')
const confirm = require('inquirer-confirm')

module.exports = async function clean (options) {
  const target = path.join(options.dir, options.dist)

  try {
    await confirm({
      question: `Are you sure you want to remove ${target}?`,
      default: false
    })
    await fs.remove(target)
  } catch (err) {
    // nothing happens
  }
}
