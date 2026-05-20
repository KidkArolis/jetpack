# Customizing SWC

Jetpack uses [rspack's `builtin:swc-loader`](https://rspack.rs/guide/features/builtin-swc-loader) to handle `.js`/`.jsx`/`.ts`/`.tsx`. The loader picks up the top-level `target` for browser targets automatically.

The defaults jetpack applies are:

```js
{
  env: {
    targets: /* derived from browserslist + the current bundle target */,
    coreJs: /* major.minor from the installed core-js */,
    mode: 'usage'
  },
  jsc: {
    externalHelpers: true
  },
  detectSyntax: 'auto',
  isModule: 'unknown'
}
```

See [`lib/rspack.js.js`](../lib/rspack.js.js) for the exact configuration.

To tweak, walk the loader options from `jetpack.config.js`:

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
