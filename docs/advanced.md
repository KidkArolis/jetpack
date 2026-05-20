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

The second argument is `{ command, mode, target, dir, findLoader }`, where `target` is the generated bundle target: `'modern'` or `'legacy'`.

Use `findLoader(name)` to tweak Jetpack's generated loader options without depending on the internal rule nesting:

```js
export default {
  rspack: (config, { findLoader }) => {
    for (const loader of findLoader('css-loader')) {
      loader.options.modules ??= {}
      loader.options.modules.namedExport = false
      loader.options.modules.exportLocalsConvention = 'as-is'
    }

    for (const loader of findLoader('sass-loader')) {
      loader.options.sassOptions = {
        silenceDeprecations: ['color-functions', 'global-builtin', 'import', 'slash-div', 'if-function']
      }
      loader.options.additionalData = `@import './src/styles/resources.scss';`
    }
  }
}
```

`findLoader()` accepts a string or `RegExp` and returns the actual loader objects, so mutations affect the generated rspack config directly. For adding new rules or plugins, keep editing `config` itself.

## SWC

Jetpack handles app `.js`, `.mjs`, `.jsx`, `.ts`, and `.tsx` files through rspack's `builtin:swc-loader`. Dependency transpilation uses a separate JS-only `.js`/`.mjs` rule so npm packages can be compiled for the configured browser target without running TypeScript/JSX parsing across `node_modules`.

Defaults:

```js
{
  env: {
    targets: /* derived from browserslist + bundle target */,
    coreJs: /* major.minor from installed core-js */,
    mode: /* polyfills option, default 'usage' */
  },
  jsc: {
    externalHelpers: true
  },
  detectSyntax: 'auto',
  isModule: 'unknown'
}
```

Set `polyfills: false` to omit `coreJs` and `mode` from SWC's env options.

To tweak SWC, find the generated loader options:

```js
export default {
  rspack: (config, { findLoader }) => {
    for (const loader of findLoader('builtin:swc-loader')) {
      loader.options.jsc.parser = { decorators: true }
    }
  }
}
```

## Browserslist

Jetpack uses browserslist for JS transpilation, CSS syntax lowering, polyfill selection, and modern/legacy serving.

By default, the modern bundle uses `baseline widely available with downstream`. The legacy bundle uses the Browserslist `defaults` query. To override either bundle, define `modern` and `legacy` environments:

```json
{
  "browserslist": {
    "modern": ["baseline widely available with downstream"],
    "legacy": ["defaults"]
  }
}
```

## Hot Reloading

Hot reloading is on by default in development. Disable it with `--no-hot`, `hot: false`, or `hot: { enabled: false }`. Use `hot: { quiet: true }` to silence browser HMR logs.

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

## Chunk Load Retry

Production builds can add a small runtime wrapper that retries failed async chunk loads:

```js
export default {
  build: {
    chunkLoadRetry: {
      maxAttempts: 5,
      base: 1.8,
      multiplier: 500
    }
  }
}
```

Set `build.chunkLoadRetry: true` to use those defaults. The retry delay is `base ** (attempt - 1) * multiplier` milliseconds.
