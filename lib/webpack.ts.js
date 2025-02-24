const browsers = require('./browsers')

module.exports = (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.(ts|tsx)$/,
    exclude: /(node_modules)/,
    use: [
      {
        loader: 'builtin:swc-loader',
        options: {
          env: {
            targets: browsers.query(options),
            coreJs: 3,
            mode: 'usage'
          },
          jsc: {
            parser: {
              syntax: 'typescript',
              exportDefaultFrom: true,
              jsx: true
            },
            externalHelpers: true,
            transform: {}
          },
          isModule: 'unknown'
        }
      }
    ]
  })
}
