const neodoc = require('neodoc')

const getArgs = () => neodoc.run(`
jetpack 🚀

Usage:
  jetpack [options] [<command>] [<path>]

Commands:

  dev    Run the app in development mode (default)
  start  Run the app in production mode
  build  Build the app for production

Options:

  -p --port <n>      Port [default: 3000].
  -j --jsx <pragma>  Specify jsx pragma, defaults to h, React.createElement, Preact.h.
  --public <path>    Public directory with static assets.
  --html <path>      Entry page template.
  -h --help          Show this screen.
  -v --version       Show version.
`
)

module.exports.run = function run () {
  const args = getArgs()

  console.log(args)
}
