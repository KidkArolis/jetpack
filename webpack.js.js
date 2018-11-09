module.exports = (options) => ({
  test: /\.(js|mjs|jsx)/,
  exclude: /(node_modules)/,
  use: {
    loader: require.resolve('babel-loader'),
    options: {
      plugins: [
        require.resolve('@babel/plugin-syntax-dynamic-import')
      ],
      presets: [
        [
          require.resolve('@babel/preset-env'), {
            useBuiltIns: 'usage',
            modules: false,
            targets: {
              'browsers': options.browsers
            }
          }
        ],
        [
          require.resolve('@babel/preset-react'), {
            pragma: options.jsx
          }
        ]
      ]
    }
  }
})
