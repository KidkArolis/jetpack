# Customizing SWC

Jetpack uses SWC via swc-loader by default, because:

- this way you get JSX support out of the box
- you can be sure that the code you write will run in all the browsers you support

Jetpack uses the following SWC options:

```js
{
  env: {
    targets: browsers.query(options),
    coreJs: 3,
    mode: 'entry',
    exclude: ['transform-typeof-symbol']
  },
  jsc: {
    parser: {
      jsx: true,
      exportDefaultFrom: true
    },
    transform: {},
  }
}
```

See [lib/webpack.js.js](../lib/webpack.js.js) for the exact configuration.

These options can be modified via `jetpack.config.js`:

```
module.exports = {
  webpack: (config, options) => {
    for (const rule of config.module.rules[0].oneOf) {
      for (const loader of rule.use) {
        if (loader.loader.includes('/swc-loader')) {
          loader.options.env.mode = 'usage'
        }
      }
    }
  }
}
```
