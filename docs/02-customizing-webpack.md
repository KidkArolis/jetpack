# Customizing Webpack

You can extend the default webpack config using `jetpack.config.js`.

Here's an example of using an extra loader and a couple plugins.

```js
// jetpack exposes it's own copy of webpack so that you can use webpack plugins
const webpack = require('jetpack/webpack')
const WorkboxWebpackPlugin = require('workbox-webpack-plugin')

module.exports = {
  webpack: (config, options) => {
    // unshift to run before other loaders, since
    // we're overriding the preconfigured svg loader
    config.module.rules.oneOf[0].unshift({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    // reference jetpack's webpack to use the
    // plugins that ship with webpack
    config.plugins.push(
     new webpack.NamedModulesPlugin()
    )

    // in production, add the lovely Workbox plugin
    if (options.production) {
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
