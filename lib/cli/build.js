// const app = express()
// const webpackConfig = wpConf(options)
// const compiler = webpack(webpackConfig)

// if (options.build) {
//   build({ pkg, options })
//   return
// }

// function build ({ compiler }) {
//   // if we're building, switch to prod env
//   process.env.NODE_ENV = 'production'
//   compiler.run(function (err, stats) {
//     if (err) return console.log(err)
//     console.log(stats.toString())
//   })
// }

module.exports = function (options) {
  return 'build'
}
