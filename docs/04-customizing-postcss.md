# Customizing PostCSS

Jetpack uses PostCSS by default, because:

- this way you get autoprefixing and modern CSS features
- you can be sure that the code you write will run in all the browsers you support

Jetpack uses the following PostCSS plugins and presets:

- `postcss-import`
- `postcss-flexbugs-fixes`
- `postcss-preset-env`

See [lib/webpack.css.js](../lib/webpack.css.js) for the exact configuration.

It's a bit more difficult to extend PostCSS than say Babel. There are 2 options that jetpack provides here.

## Specify extra postcss-preset-env features

If you just want to go beyond using Stage 2 PostCSS features, you can toggle them in `jetpack.config.js`:

```js
module.exports = {
  css: {
    features: {
      'nesting-rules': true,
      'custom-media-queries': true
    }
  }
}
```

## Use postcss.config.js

You can also create a postcss.config.js and use that to configure any plugins or other PostCSS features. Note that this will override any of the jetpack's configurations, so you might want to do something like:

```js
// postcss.config.js
module.exports = {
  plugins: {
    'jetpack/postcss-import': {},
    'jetpack/postcss-flexbugs-fixes': {},
    'jetpack/postcss-preset-env': {
      autoprefixer: { grid: true }
    },
    'colorguard': {},
    'stylelint': {}
  }
}
```
