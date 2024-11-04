# Customizing Rspack

You can extend the default rspack config using `jetpack.config.js`.

Here's an example of using an extra loader and a couple plugins.

```js
// jetpack exposes it's own copy of rspack so that you can use rspack plugins
const rspack = require('jetpack/rspack')
const WorkboxWebpackPlugin = require('workbox-webpack-plugin')

module.exports = {
  rspack: (config, options) => {
    // unshift to run before other loaders, since
    // we're overriding the preconfigured svg loader
    config.module.rules[0].oneOf.unshift({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    // reference jetpack's rspack to use the
    // plugins that ship with rspack
    config.plugins.push(
     new rspack.DefinePlugin()
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
