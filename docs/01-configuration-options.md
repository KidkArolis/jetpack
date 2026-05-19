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
  -d, --dir [path]     run jetpack in the context of this directory
  -c, --config [path]  config file to use, defaults to jetpack.config.js
  -r, --no-hot         disable hot reloading
  -u, --no-minify      disable minification
  -m, --modern         build a modern bundle
  -l, --legacy         build a legacy bundle
  -i, --print-config   print the rspack config object used in the current command
  -o, --log [levels]   select log levels: info, progress, none
  -v, --version        print the version of jetpack and rspack
  -h, --help           display help for command
```

## Configuration File

Jetpack can also be configured using `jetpack.config.js` (or `.mjs`/`.cjs`). Here are all of the available options.

```js
export default {
  // directory to run jetpack in
  dir: '.',

  // entry module path relative to dir
  // defaults to '.' — rspack resolves it via package.json main / index.js
  entry: '.',

  // port of the dev server
  port: 3030,

  // relative path to a static assets dir (files served from /assets/* without rspack processing)
  static: 'assets',

  // build output path relative to dir
  dist: 'dist',

  // used to build the static asset URLs embedded in index.html
  // (e.g. 'https://cdn.example.com/assets/'). Inside the bundle, chunk URLs
  // are resolved at runtime from the loaded script's location — works for
  // CDN and sub-path deployments without further config.
  publicPath: '/assets/',

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
  rspack: (config, options) => {
    // config: the rspack config jetpack generated
    // options: this jetpack options object including defaults (has options.production)
  }
}
```

## HTML Template

By default, Jetpack renders a small app shell with `<div id="root"></div>` and injects generated CSS, runtime, and JS tags.

For full control, provide an `html` function. Jetpack passes pre-rendered tag groups so custom HTML does not need to loop over assets.

```js
export default {
  cspNonce: true,
  html: ({ html, title, tags, cspNonceAttr, production }) => html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${tags.css}
        ${production
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

When `cspNonce: true` is set, Jetpack inserts `__JETPACK_CSP_NONCE__` into script nonces and exposes `cspNonce` and `cspNonceAttr` to the HTML renderer. Replace the placeholder per request:

```js
import { renderHtmlResponse } from 'jetpack/html'

res.send(renderHtmlResponse(indexHtml, { cspNonce: res.locals.cspNonce }))
```

## Modules

Jetpack exposes the following entry points.

### `jetpack/serve`

Middleware that serves your assets in both dev (by proxying to the dev server) and production (from `dist`). For example:

```js
import express from 'express'
import jetpack from 'jetpack/serve'

const app = express()
app.get('/api/unicorns', (req, res) => {...})
app.use(jetpack)
```

When `cspNonce: true` is enabled, `jetpack/serve` replaces nonce placeholders in `index.html` with `res.locals.cspNonce`.

### `jetpack/html`

Exports helpers for custom HTML rendering.

```js
import { html, renderHtmlResponse } from 'jetpack/html'

html`<div>${'syntax highlighting helper only'}</div>`
renderHtmlResponse(indexHtml, { cspNonce: res.locals.cspNonce })
```

### `jetpack/options`

Reads the resolved jetpack configuration. Useful for server-side HTML rendering, accessing the asset list, etc.

```js
import getOptions from 'jetpack/options'

const options = await getOptions()
options.production
options.port
options.assets.js // string[]: URLs of js entry chunks
options.assets.css // string[]: URLs of css entry chunks
options.assets.runtime // string[]: URL of runtime chunk
options.runtime // string: inlined runtime script content
```

### `jetpack/proxy`

Proxy helper for customising proxy behaviour via a function.

```js
import proxy from 'jetpack/proxy'

export default {
  proxy: (app) => {
    app.post('/custom', (req, res) => res.send(422))
    app.get('/api/*', proxy('http://localhost:3000'))
  }
}
```

### `jetpack/rspack`

Re-exports the rspack module so you can use its plugins.

### `jetpack/rspack.config`

The full rspack config jetpack generates. Used internally; can be passed to `rspack` directly if you want to invoke it without `jetpack`.
