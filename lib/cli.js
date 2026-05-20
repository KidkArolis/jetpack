import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import path from 'node:path'
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
    'no-hot': { type: 'boolean', short: 'r' },
    minify: { type: 'boolean' },
    'no-minify': { type: 'boolean', short: 'u' },
    yes: { type: 'boolean', short: 'y' },
    'dry-run': { type: 'boolean' },
    'print-config': { type: 'boolean', short: 'i' },

    // String options
    port: { type: 'string', short: 'p' },
    host: { type: 'string' },
    dir: { type: 'string', short: 'd' },
    config: { type: 'string', short: 'c' },
    log: { type: 'string', short: 'o', default: 'info,progress' },
    target: { type: 'string', short: 't' },
    coverage: { type: 'string' }
  },
  allowPositionals: true
}

function printHelp(command) {
  if (command === 'dev') return printDevHelp()
  if (command === 'build') return printBuildHelp()
  if (command === 'inspect') return printInspectHelp()
  if (command === 'browsers') return printBrowsersHelp()
  if (command === 'clean') return printCleanHelp()

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
  --host <host>        host for the dev server, defaults to localhost
  -d, --dir [path]     run jetpack in the context of this directory
  -c, --config [path]  config file to use, defaults to jetpack.config.js
  -r, --no-hot         disable hot reloading
  -u, --no-minify      disable minification
  -t, --target <name>  bundle target: modern, legacy, all
  -i, --print-config   print the rspack config object used in the current command
  -o, --log [levels]   select log levels: info, progress, all, silent
  -v, --version        print the version of jetpack and rspack
  -h, --help           display help for command

Options for browsers command:
  --coverage [country] display coverage for specific country, e.g. --coverage=US

Examples:
  jetpack
  jetpack --port 3500 --log=all ./my/app
  jetpack build
  jetpack build --print-config
  jetpack build --target all
  jetpack inspect ./my/app
  jetpack browsers --coverage=US

Versions:
  Jetpack ${pkg.version}
  Rspack ${rspackPkg.version}
`)
}

function printDevHelp() {
  console.log(`
Usage: jetpack dev [options] [path]

Run the dev server.

Options:
  -p, --port <n>       port, defaults to 3030
  --host <host>        host, defaults to localhost
  -r, --no-hot         disable hot reloading
  -t, --target <name>  bundle target: modern or legacy
  -i, --print-config   print the rspack config object
  -o, --log [levels]   select log levels: info, progress, all, silent
  -h, --help           display help for command
`)
}

function printBuildHelp() {
  console.log(`
Usage: jetpack build [options] [path]

Build for production.

Options:
  -t, --target <name>  bundle target: modern, legacy, all
  -u, --no-minify      disable minification
  -i, --print-config   print the rspack config object
  -o, --log [levels]   select log levels: info, progress, all, silent
  -h, --help           display help for command
`)
}

function printInspectHelp() {
  console.log(`
Usage: jetpack inspect [options] [path]

Write a self-contained bundle treemap to dist/inspect.html.

Options:
  -t, --target <name>  bundle target: modern or legacy
  -o, --log [levels]   select log levels: info, progress, all, silent
  -h, --help           display help for command
`)
}

function printBrowsersHelp() {
  console.log(`
Usage: jetpack browsers [options]

Print supported browsers.

Options:
  -t, --target <name>  browser target: modern, legacy, all
  --coverage [country] display coverage for specific country, e.g. --coverage=US
  -h, --help           display help for command
`)
}

function printCleanHelp() {
  console.log(`
Usage: jetpack clean [options]

Remove the dist directory.

Options:
  -y, --yes            remove without prompting
  --dry-run           print what would be removed without deleting it
  -h, --help           display help for command
`)
}

export function parseCliArgs(argv = process.argv.slice(2)) {
  const { values: flags, positionals } = parseArgs({ ...config, args: argv })

  let command = 'dev'
  let commandExplicit = false
  if (positionals.length > 0 && commands.includes(positionals[0])) {
    command = positionals.shift()
    commandExplicit = true
  } else if (positionals.length > 0 && looksLikeUnknownCommand(positionals[0], flags)) {
    throw new Error(`Unknown command "${positionals[0]}"`)
  }

  if (flags['no-hot']) flags.hot = false
  if (flags['no-minify']) flags.minify = false
  if (flags['print-config']) flags.printConfig = flags['print-config']
  if (flags['dry-run']) flags.dryRun = flags['dry-run']

  return {
    command,
    commandExplicit,
    entry: positionals[0],
    flags,
    help: !!flags.help,
    version: !!flags.version
  }
}

export function options(argv = process.argv.slice(2)) {
  const cli = parseCliArgs(argv)
  const mode = cli.command === 'build' || cli.command === 'inspect' ? 'production' : 'development'

  // Keep the CLI behavior where config files can observe production mode,
  // without making the programmatic options API mutate process.env.
  if (mode === 'production' && !process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'
  }

  return getOptions({
    command: cli.command,
    mode,
    dir: cli.flags.dir,
    entry: cli.entry,
    config: cli.flags.config,
    overrides: cli.flags
  })
}

export async function run(argv = process.argv.slice(2)) {
  let cli
  try {
    cli = parseCliArgs(argv)
  } catch (err) {
    console.error(`jetpack › ${err.message}`)
    process.exit(1)
  }

  if (cli.version) {
    console.log(`Jetpack ${pkg.version}\nRspack ${rspackPkg.version}`)
    process.exit(0)
  }

  if (cli.help) {
    printHelp(cli.commandExplicit ? cli.command : null)
    process.exit(0)
  }

  try {
    const opts = await options(argv)
    const log = createLogger(opts.logLevels)
    const mod = await import(`./${cli.command}.js`)
    await mod.default(opts, log)
  } catch (err) {
    console.error(`jetpack › ${err.stack || err.message || err}`)
    process.exit(1)
  }
}

function looksLikeUnknownCommand(input, flags) {
  if (flags.help || flags.version) return false
  if (input.startsWith('.') || input.startsWith('/') || input.startsWith('~')) return false
  if (input.includes('/') || input.includes(path.sep)) return false
  if (path.extname(input)) return false

  const dir = flags.dir ? path.resolve(flags.dir) : process.cwd()
  return !existsSync(path.join(dir, input))
}
