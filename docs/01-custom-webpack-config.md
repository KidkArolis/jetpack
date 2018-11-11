## Custom webpack loaders

You can extend the default webpack config using `jetpack.config.js`:

```js
// jetpack exposes it's webpack so you could use webpack's plugins
const webpack = require('jetpack/webpack')
const WorkboxWebpackPlugin = require('workbox-webpack-plugin')

module.exports = {
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    config.plugins.push(
     new webpack.NamedModulesPlugin()
    )

    if (options.mode === 'production') {
      config.plugins.push(
        new WorkboxWebpackPlugin.GenerateSW({
          clientsClaim: true,
          exclude: [/\.map$/, /asset-manifest\.json$/]
        })
      )
    }

    return config
  }
}
```