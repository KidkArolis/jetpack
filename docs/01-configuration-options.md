# Configuration Options

## CLI

Jetpack accepts some configuration via CLI.

```
$ jetpack --help

Usage: jetpack [command] [options] [path]

Commands:
  dev       run the dev server (default)
  build     build for production
  inspect   write a self-contained treemap HTML (dist/inspect.html)
  browsers  print supported browsers
  clean     remove the dist dir

Options:
  -p, --port <n>       port, defaults to 3030
  --host <host>        host for the dev server, defaults to localhost
  -d, --dir [path]     run jetpack in the context of this directory
  -c, --config [path]  config file to use, defaults to jetpack.config.js
  -r, --no-hot         disable hot reloading
  -u, --no-minify      disable minification
  -t, --target <name>  bundle target: modern, legacy, all
  -i, --print-config   print the rspack config object used in the current command
  -o, --log [levels]   select log levels: info, progress, all, silent
  -v, --version        print the version of jetpack and rspack
  -h, --help           display help for command
```

## Configuration File

Jetpack can also be configured using `jetpack.config.js` (or `.mjs`/`.cjs`). Here are all of the available options.

```js
import { defineConfig } from 'jetpack'

export default defineConfig({
  // entry module path relative to the project root
  // defaults to '.' — rspack resolves it via package.json main / index.js
  entry: '.',

  // port and host of the dev server
  port: 3030,
  host: 'localhost',

  // build output path relative to the project root
  outDir: 'dist',

  // used to build the static asset URLs embedded in index.html
  // (e.g. 'https://cdn.example.com/assets/'). Inside the bundle, chunk URLs
  // are resolved at runtime from the loaded script's location — works for
  // CDN and sub-path deployments without further config.
  assetBaseUrl: '/assets/',

  // hot reloading
  hot: true,
  // or with options:
  // hot: { quiet: true },  // silence HMR logs in browser console

  // source maps for js and css
  // true by default in development, off by default in production
  sourceMaps: true,

  // to turn off minification in production for any reason
  minify: false,

  // set to `true` to enable retries on chunk loads (5 attempts, exponential backoff)
  chunkLoadRetry: false,

  // build-time constants injected with rspack.DefinePlugin
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
    'process.env.RELEASE_ENV': process.env.RELEASE_ENV || 'dev'
  },

  // proxy certain requests to a different server
  // e.g. { '/api/*': 'http://localhost:3000',
  //        '/api2/*': 'http://localhost:3001/:splat' }
  // or a function that receives an express app:
  // (app) => app.get('/api/foo', (req, res) => {...})
  proxy: {},

  // configure logging
  log: 'info,progress',

  // page title (defaults to package.json#name or 'jetpack')
  title: 'jetpack',

  // add nonce placeholders to jetpack-owned script tags
  // replace them per request with `renderHtmlResponse` from `jetpack/html`
  cspNonce: false,

  // custom index.html renderer. If omitted, jetpack renders a default app shell.
  html: ({ html, title, tags, cspNonceAttr }) => html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>${title}</title>
        ${tags.css}
      </head>
      <body>
        <div id="root"></div>
        ${tags.runtime} ${tags.js}
      </body>
    </html>
  `,

  css: {
    // css modules
    modules: false,

    // shortcut for setting lightningcss feature flags
    // see https://rspack.dev/guide/features/builtin-lightningcss-loader#options
    features: {
      include: {},
      exclude: {}
    }
  },

  target: {
    modern: true,
    legacy: false
  },

  // rspack config transform fn — see 02-customizing-rspack.md
  rspack: (config, context) => {
    // config: the rspack config jetpack generated
    // context: { command, mode, target, dir }
  }
})
```

## HTML Template

By default, Jetpack renders a small app shell with `<div id="root"></div>` and injects generated CSS, runtime, and JS tags.

For full control, provide an `html` function. Jetpack passes the resolved options, the current build manifest, and pre-rendered tag groups so custom HTML does not need to loop over assets.

```js
export default {
  cspNonce: true,
  html: ({ html, title, tags, manifest, cspNonceAttr, mode }) => html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${tags.css}
        ${mode === 'production'
          ? html`
              <script ${cspNonceAttr}>
                window.analytics = true
              </script>
            `
          : ''}
      </head>
      <body>
        <div id="root"></div>
        ${tags.runtime} ${tags.js}
      </body>
    </html>
  `
}
```

The `html` helper is `String.raw`; it exists so editors can syntax-highlight HTML template literals. It does not escape interpolated values.

## Build Manifest

`jetpack build` writes `dist/manifest.json` with the emitted asset URLs for each built target:

```json
{
  "modern": {
    "js": ["/assets/bundle.d399b1f50adbbdb5.js"],
    "css": ["/assets/bundle.b3e6bb21.css"],
    "runtime": ["/assets/runtime~bundle.744331fd996ca501.js"],
    "other": []
  }
}
```

The resolved options describe what Jetpack should do. The manifest describes what the build produced.

When `cspNonce: true` is set, Jetpack inserts `__JETPACK_CSP_NONCE__` into script nonces and exposes `cspNonce` and `cspNonceAttr` to the HTML renderer. Replace the placeholder per request:

```js
import { renderHtmlResponse } from 'jetpack/html'

res.send(renderHtmlResponse(indexHtml, { cspNonce: res.locals.cspNonce }))
```

## Define

Use `define` for build-time constants. Values are JSON-stringified and passed to `rspack.DefinePlugin`.

```js
export default {
  define: {
    __RELEASE_ENV__: 'prd',
    'process.env.RELEASE_ENV': 'prd',
    'process.env.POSTHOG_ENABLED': true
  }
}
```

Jetpack only defines the exact keys you provide. For example, defining `'process.env.NODE_ENV'` replaces `process.env.NODE_ENV` reads, but does not create a browser runtime `process` object. For unusual compatibility needs, use the `rspack` config hook directly.

## Modules

Jetpack exposes the following entry points.

### `jetpack`

The package root exposes the small library API:

```js
import { defineConfig, resolveConfig } from 'jetpack'
```

Use `defineConfig` in `jetpack.config.js` when you want to make the config intent explicit without changing runtime behavior.
Use `resolveConfig` when an API needs Jetpack's resolved config object:

```js
const config = await resolveConfig({
  command: process.env.NODE_ENV === 'production' ? 'build' : 'dev',
  dir: process.cwd()
})
config.mode
config.port
config.outDir
config.assetBaseUrl
config.assetBasePathname
```

### `jetpack/serve`

Factory for middleware that serves your assets in both dev (by proxying to the dev server) and production (from `dist`). For example:

```js
import express from 'express'
import { resolveConfig } from 'jetpack'
import { serve } from 'jetpack/serve'

const app = express()
const config = await resolveConfig({
  command: process.env.NODE_ENV === 'production' ? 'build' : 'dev'
})
app.get('/api/unicorns', (req, res) => {...})
app.use(serve(config))
```

When `cspNonce: true` is enabled, `jetpack/serve` replaces nonce placeholders in `index.html` with `res.locals.cspNonce`.

### `jetpack/html`

Exports helpers for custom HTML rendering.

```js
import { html, renderHtmlResponse } from 'jetpack/html'

html`<div>${'syntax highlighting helper only'}</div>`
renderHtmlResponse(indexHtml, { cspNonce: res.locals.cspNonce })
```

### `jetpack/rspack`

Re-exports the rspack module so you can use its plugins.

### `jetpack/rspack-config`

The full rspack config Jetpack generates. It accepts either a resolved config object or the same input as `resolveConfig`.

```js
import createRspackConfig from 'jetpack/rspack-config'

const configs = await createRspackConfig({ command: 'build', dir: process.cwd() })
configs.modern
configs.legacy
```

Build asset URLs live in `dist/manifest.json`, not in the resolved config object.
