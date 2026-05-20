# Customizing Rspack

Extend the default rspack config via `jetpack.config.js`.

```js
import rspack from 'jetpack/rspack'
import WorkboxRspackPlugin from '@aaroon/workbox-rspack-plugin'

export default {
  rspack: (config, context) => {
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

    if (context.mode === 'production') {
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

The second argument is `{ command, mode, target, dir }`, where `target` is the generated bundle target (`'modern'` or `'legacy'`).
