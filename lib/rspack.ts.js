import { query } from './browsers.js'

export default (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.(ts|tsx)$/,
    exclude: /(node_modules)/,
    use: [
      {
        loader: 'builtin:swc-loader',
        options: {
          env: {
            targets: query(options),
            coreJs: '3.40',
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
