const chalk = require('chalk')

module.exports = function reporter (log) {
  return function reporter (middlewareOptions, options) {
    const { state, stats: statsFull } = options

    if (state) {
      const stats = statsFull.toJson()
      printAssets(stats)
      if (statsFull.hasErrors()) {
        stats.errors.forEach(error => {
          log.error(chalk.red(error))
        })
        log.error(`Failed to compile ${stats.time}ms`)
      } else if (statsFull.hasWarnings()) {
        stats.warnings.forEach(error => {
          log.error(chalk.red(error))
        })
        log.warn(chalk.yellow(`Compiled with warnings ${stats.time}ms'`))
      } else {
        log.info(`Compiled successfully ${stats.time}ms`)
      }
    }
  }
}

const getText = (arr, row, col) => {
  return arr[row][col].value
}

const table = (array, align, splitter) => {
  const rows = array.length
  const cols = array[0].length
  const colSizes = new Array(cols)
  for (let col = 0; col < cols; col++) colSizes[col] = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const value = `${getText(array, row, col)}`
      if (value.length > colSizes[col]) {
        colSizes[col] = value.length
      }
    }
  }
  for (let row = 0; row < rows; row++) {
    process.stdout.write(chalk.green('jetpack: '))
    for (let col = 0; col < cols; col++) {
      const format = (...args) => process.stdout.write(array[row][col].color(...args))
      const value = `${getText(array, row, col)}`
      let l = value.length
      if (align[col] === 'l') format(value)
      if (col !== cols - 1) {
        for (; l < colSizes[col]; l++) process.stdout.write(chalk.white(' '))
      }
      if (align[col] === 'r') format(value)
      if (col + 1 < cols && colSizes[col] !== 0) {
        process.stdout.write(chalk.white(splitter || '  '))
      }
    }
    process.stdout.write('\n')
  }
}

const getAssetColor = (asset, defaultColor) => {
  if (asset.isOverSizeLimit) {
    return chalk.yellow
  }

  return defaultColor
}

function printAssets (obj) {
  const modules = {}
  obj.modules.forEach(module => {
    module.chunks.forEach(chunk => {
      modules[chunk] = modules[chunk] || 0
      modules[chunk] += 1
    })
  })

  if (obj.assets && obj.assets.length > 0) {
    const t = [
      [
        {
          value: 'Asset',
          color: chalk.bold
        },
        {
          value: 'Modules',
          color: chalk.bold
        },
        {
          value: 'Size',
          color: chalk.bold
        },
        {
          value: '',
          color: chalk.bold
        }
      ]
    ]
    for (const asset of obj.assets) {
      t.push([
        {
          value: asset.name,
          color: getAssetColor(asset, chalk.blue)
        },
        {
          value: asset.chunks.reduce((acc, chunk) => acc + modules[chunk], 0),
          color: getAssetColor(asset, chalk.white)
        },
        {
          value: formatSize(asset.size),
          color: getAssetColor(asset, chalk.white)
        },
        {
          value: asset.isOverSizeLimit ? '[big]' : '',
          color: getAssetColor(asset, chalk.white)
        }
      ])
    }
    table(t, 'lll')
  }
}

function formatSize (size) {
  if (size <= 0) {
    return '0 bytes'
  }
  const abbreviations = ['bytes', 'KiB', 'MiB', 'GiB']
  const index = Math.floor(Math.log(size) / Math.log(1024))
  return `${+(size / Math.pow(1024, index)).toPrecision(3)} ${
    abbreviations[index]
  }`
}
