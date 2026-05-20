# Advanced

Jetpack's defaults are meant to cover the common path. When they do not, use the rspack hook.

## Rspack

```js
import rspack from 'jetpack/rspack'

export default {
  rspack: (config, context) => {
    config.module.rules[0].oneOf.unshift({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    config.plugins.push(
      new rspack.DefinePlugin({
        __EXPERIMENT__: JSON.stringify(true)
      })
    )

    return config
  }
}
```

The second argument is `{ command, mode, target, dir }`, where `target` is the generated bundle target: `'modern'` or `'legacy'`.

## SWC

Jetpack handles `.js`, `.mjs`, `.jsx`, `.ts`, and `.tsx` through rspack's `builtin:swc-loader`.

Defaults:

```js
{
  env: {
    targets: /* derived from browserslist + bundle target */,
    coreJs: /* major.minor from installed core-js */,
    mode: 'usage'
  },
  jsc: {
    externalHelpers: true
  },
  detectSyntax: 'auto',
  isModule: 'unknown'
}
```

To tweak SWC, walk the generated loader options:

```js
export default {
  rspack: (config) => {
    for (const rule of config.module.rules[0].oneOf) {
      for (const loader of rule.use || []) {
        if (loader.loader === 'builtin:swc-loader') {
          loader.options.jsc.parser = { decorators: true }
        }
      }
    }
  }
}
```

## Browserslist

Jetpack uses browserslist for JS transpilation, CSS syntax lowering, and modern/legacy serving.

By default, the modern bundle uses the `defaults` browserslist query. For differential builds, define `modern` and `legacy` environments:

```json
{
  "browserslist": {
    "modern": ["last 1 version", "> 1%"],
    "legacy": ["> 0.1%"]
  }
}
```

## Hot Reloading

Hot reloading is on by default in development. Disable it with `--no-hot` or `hot: false`.

CSS hot reloads automatically. React components use fast refresh when React is installed.

For non-React code, accept HMR in your entry module:

```js
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  import.meta.webpackHot.dispose(() => {
    // clean up before the module re-runs
  })
}
```

## Inspect

Use `jetpack inspect` to build once and write a self-contained treemap to `${build.outDir}/inspect.html`.
