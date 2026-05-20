# Configuration

Most apps can run Jetpack without a config file. Add `jetpack.config.js` when you need to change the entry, dev server, build output, HTML shell, CSS modules, proxying, or rspack config.

```js
import { defineConfig } from 'jetpack'

export default defineConfig({
  entry: '.',
  port: 3030,
  host: 'localhost',
  assetBaseUrl: '/assets/',
  hot: true,
  target: 'modern',

  build: {
    outDir: 'dist',
    minify: true
  },

  html: {
    title: 'my-app'
  },

  css: {
    modules: false
  }
})
```

## CLI

```sh
jetpack [command] [options] [path]
```

Commands:

| Command | Description |
| --- | --- |
| `dev` | Run the dev server. This is the default. |
| `build` | Build for production. |
| `inspect` | Write a self-contained bundle treemap. |
| `browsers` | Print supported browser targets. |
| `clean` | Remove the build output directory. |

Useful options:

| Option | Description |
| --- | --- |
| `-p, --port <n>` | Dev server port. |
| `--host <host>` | Dev server host. |
| `-d, --dir <path>` | Run Jetpack in another project directory. |
| `-c, --config <path>` | Use a specific config file. |
| `-r, --no-hot` | Disable hot reloading. |
| `-u, --no-minify` | Disable production minification. |
| `-t, --target <name>` | Bundle target: `modern`, `legacy`, or `all`. |
| `-i, --print-config` | Print the generated rspack config. |
| `-o, --log <levels>` | Log levels: `info`, `progress`, `all`, or `silent`. |

## Options

Top-level options:

| Option | Default | Description |
| --- | --- | --- |
| `entry` | `'.'` | Entry module relative to the project root. Rspack resolves `.` through `package.json#main` or `index.js`. |
| `port` | `3030` | Dev server port. |
| `host` | `'localhost'` | Dev server host. |
| `assetBaseUrl` | `'/assets/'` | URL prefix written into generated HTML. Runtime chunk loading uses the loaded script URL automatically. |
| `hot` | `true` | Set `false` to disable hot reload, or `{ quiet: true }` to silence browser HMR logs. |
| `target` | `'modern'` | `modern`, `legacy`, or `all`. Dev and inspect support one target at a time. |
| `define` | `{}` | Build-time constants for `rspack.DefinePlugin`. |
| `proxy` | `{}` | Dev proxy map, or a function that receives the Express app. |
| `log` | `'info,progress'` | Log levels: `info`, `progress`, `all`, or `silent`. |
| `rspack` | `undefined` | Function that receives the generated rspack config. |

Build options:

| Option | Default | Description |
| --- | --- | --- |
| `build.outDir` | `'dist'` | Output directory relative to the project root. |
| `build.sourceMaps` | dev only | Set `true` to force source maps, or `false` to disable them. |
| `build.minify` | `true` | Minify production JS and CSS. |
| `build.chunkLoadRetry` | `false` | Enable retry runtime for failed async chunk loads. |

HTML options:

| Option | Default | Description |
| --- | --- | --- |
| `html.title` | package name or `'jetpack'` | Page title for the default HTML shell. |
| `html.cspNonce` | `false` | Add nonce placeholders to Jetpack-owned script tags. |
| `html.render` | `null` | Custom HTML renderer. |

CSS options:

| Option | Description |
| --- | --- |
| `css.modules: false` | All CSS is global. |
| `css.modules: true` | App CSS is modular by default. `*.global.css` and `*.global.scss` opt out. |
| `css.modules: { conventional: true }` | Only `*.module.css` and `*.module.scss` opt in. |

Any other object keys under `css.modules` are passed to `css-loader`'s modules options.

## HTML

Jetpack renders a small app shell by default. For full control, provide `html.render`:

```js
export default {
  html: {
    cspNonce: true,
    render: ({ html, title, tags, cspNonceAttr, mode }) => html`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          ${tags.css}
          ${mode === 'production' ? html`<script ${cspNonceAttr}>window.analytics = true</script>` : ''}
        </head>
        <body>
          <div id="root"></div>
          ${tags.runtime} ${tags.js}
        </body>
      </html>
    `
  }
}
```

The `html` helper is `String.raw`; it exists so editors can syntax-highlight HTML template literals. It does not escape interpolated values.

When `html.cspNonce: true` is set, Jetpack writes `__JETPACK_CSP_NONCE__` placeholders. Replace them per request:

```js
import { renderHtmlResponse } from 'jetpack/html'

res.send(renderHtmlResponse(indexHtml, { cspNonce: res.locals.cspNonce }))
```

## Public Modules

```js
import { defineConfig, resolveConfig } from 'jetpack'
import { serve } from 'jetpack/serve'
import { html, renderHtmlResponse } from 'jetpack/html'
import rspack from 'jetpack/rspack'
import createRspackConfig from 'jetpack/rspack-config'
```

`resolveConfig()` returns the resolved Jetpack config:

```js
const config = await resolveConfig({ command: 'build', dir: process.cwd() })
config.mode
config.build.outDir
config.assetBaseUrl
```

`jetpack build` writes emitted asset URLs to `${config.build.outDir}/manifest.json`; build assets do not live in the resolved config object.
