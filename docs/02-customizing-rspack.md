# Customizing Rspack

Extend the default rspack config via `jetpack.config.js`.

```js
import rspack from 'jetpack/rspack'
import WorkboxRspackPlugin from '@aaroon/workbox-rspack-plugin'

export default {
  rspack: (config, options) => {
    // unshift to run before other loaders — we're overriding jetpack's svg handling
    config.module.rules[0].oneOf.unshift({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    // use plugins shipped with rspack
    config.plugins.push(
      new rspack.DefinePlugin({
        /* ... */
      })
    )

    if (options.production) {
      config.plugins.push(
        new WorkboxRspackPlugin.GenerateSW({
          /* ... */
        })
      )
    }

    return config
  }
}
```
