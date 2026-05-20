import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'
import getOptions from './options.js'
import createLogger from './logger.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')
const rspackPkg = require('@rspack/core/package.json')

const commands = ['dev', 'build', 'inspect', 'browsers', 'clean']

const config = {
  options: {
    // Boolean flags
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    hot: { type: 'boolean' },
    'no-hot': { type: 'boolean' },
    minify: { type: 'boolean' },
    'no-minify': { type: 'boolean' },
    modern: { type: 'boolean', short: 'm' },
    legacy: { type: 'boolean', short: 'l' },
    'print-config': { type: 'boolean', short: 'i' },

    // String options
    port: { type: 'string', short: 'p' },
    dir: { type: 'string', short: 'd' },
    config: { type: 'string', short: 'c' },
    log: { type: 'string', short: 'o', default: 'info,progress' },
    coverage: { type: 'string' }
  },
  allowPositionals: true
}

function printHelp() {
  console.log(`
Usage: jetpack [command] [options] [path]

Commands:
  dev       run the dev server (default)
  build     build for production
  inspect   write a bundle treemap to dist/inspect.html
  browsers  print supported browsers
  clean     remove the dist dir

Options:
  -p, --port <n>       port, defaults to 3030
  -d, --dir [path]     run jetpack in the context of this directory
  -c, --config [path]  config file to use, defaults to jetpack.config.js
  -r, --no-hot         disable hot reloading
  -u, --no-minify      disable minification
  -m, --modern         build a modern bundle
  -l, --legacy         build a legacy bundle
  -i, --print-config   print the rspack config object used in the current command
  -o, --log [levels]   select log levels: info, progress, none
  -v, --version        print the version of jetpack and rspack
  -h, --help           display help for command

Options for browsers command:
  --coverage [country] display coverage for specific country, e.g. --coverage=US

Examples:
  jetpack
  jetpack --port 3500 --log=all ./my/app
  jetpack build
  jetpack build --print-config
  jetpack inspect ./my/app
  jetpack browsers --coverage=US

Versions:
  Jetpack ${pkg.version}
  Rspack ${rspackPkg.version}
`)
}

export function parseCliArgs(argv = process.argv.slice(2)) {
  const { values: flags, positionals } = parseArgs({ ...config, args: argv })

  let command = 'dev'
  if (positionals.length > 0 && commands.includes(positionals[0])) {
    command = positionals.shift()
  }

  if (flags['no-hot']) flags.hot = false
  if (flags['no-minify']) flags.minify = false
  if (flags['print-config']) flags.printConfig = flags['print-config']

  return {
    command,
    entry: positionals[0],
    flags,
    help: !!flags.help,
    version: !!flags.version
  }
}

export function options(argv = process.argv.slice(2)) {
  const cli = parseCliArgs(argv)
  const production = cli.command === 'build' || cli.command === 'inspect'

  // Keep the CLI behavior where config files can observe production mode,
  // without making the programmatic options API mutate process.env.
  if (production && !process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'
  }

  return getOptions({
    command: cli.command,
    dir: cli.flags.dir,
    entry: cli.entry,
    config: cli.flags.config,
    overrides: cli.flags
  })
}

export async function run(argv = process.argv.slice(2)) {
  const cli = parseCliArgs(argv)

  if (cli.version) {
    console.log(`Jetpack ${pkg.version}\nRspack ${rspackPkg.version}`)
    process.exit(0)
  }

  if (cli.help) {
    printHelp()
    process.exit(0)
  }

  const opts = await options(argv)
  const log = createLogger(opts.logLevels)
  process.chdir(opts.dir)
  const mod = await import(`./${cli.command}.js`)
  await mod.default(opts, log)
}
