# Configuration

Most apps can run Jetpack without a config file. Add `jetpack.config.js`, `jetpack.config.mjs`, or `jetpack.config.cjs` when you need to change the entry, dev server, build output, HTML shell, CSS modules, assets, proxying, or rspack config.

```js
import { defineConfig } from 'jetpack'

export default defineConfig({
  entry: '.',
  port: 3030,
  host: 'localhost',
  assetBaseUrl: '/assets/',
  hot: true,
  target: 'modern',
  polyfills: 'usage',
  transpileDependencies: true,
  define: {
    __RELEASE_ENV__: 'production'
  },

  build: {
    outDir: 'dist',
    minify: true,
    chunkLoadRetry: false
  },

  html: {
    title: 'my-app'
  },

  css: {
    modules: false
  },

  assets: {
    inlineLimit: 8096
  }
})
```

## CLI

```sh
jetpack [command] [options] [path]
```

Commands:

| Command    | Description                              |
| ---------- | ---------------------------------------- |
| `dev`      | Run the dev server. This is the default. |
| `build`    | Build for production.                    |
| `inspect`  | Write a self-contained bundle treemap.   |
| `browsers` | Print supported browser targets.         |
| `clean`    | Remove the build output directory.       |

Useful options:

| Option                | Description                                         |
| --------------------- | --------------------------------------------------- |
| `-p, --port <n>`      | Dev server port.                                    |
| `--host <host>`       | Dev server host.                                    |
| `-d, --dir <path>`    | Run Jetpack in another project directory.           |
| `-c, --config <path>` | Use a specific config file.                         |
| `-r, --no-hot`        | Disable hot reloading.                              |
| `-u, --no-minify`     | Disable production minification.                    |
| `-t, --target <name>` | Bundle target: `modern`, `legacy`, or `all`.        |
| `-i, --print-config`  | Print the generated rspack config.                  |
| `-o, --log <levels>`  | Log levels: `info`, `progress`, `all`, `silent`, or `none`. |
| `-v, --version`       | Print Jetpack and Rspack versions.                  |
| `-h, --help`          | Print help.                                         |

Command-specific options:

| Option                 | Command    | Description                                      |
| ---------------------- | ---------- | ------------------------------------------------ |
| `--coverage <country>` | `browsers` | Print browser coverage for a country code.       |
| `-y, --yes`            | `clean`    | Remove the output directory without prompting.   |
| `--dry-run`            | `clean`    | Print what would be removed without deleting it. |

## Options

Top-level options:

| Option                  | Default           | Description                                                                                               |
| ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------- |
| `entry`                 | `'.'`             | Entry module relative to the project root. Rspack resolves `.` through `package.json#main` or `index.js`. |
| `port`                  | `3030`            | Dev server port.                                                                                          |
| `host`                  | `'localhost'`     | Dev server host.                                                                                          |
| `assetBaseUrl`          | `'/assets/'`      | Path or full URL prefix written into generated HTML and `manifest.json`. Runtime chunk loading uses the loaded script URL automatically. |
| `hot`                   | `true`            | Set `false` to disable hot reload, or use `{ enabled: false, quiet: true }` for object form.              |
| `target`                | `'modern'`        | `modern`, `legacy`, or `all`. Dev and inspect support one target at a time.                               |
| `polyfills`             | `'usage'`         | JavaScript runtime polyfills: `usage`, `entry`, or `false`.                                               |
| `transpileDependencies` | `true`            | Controls which packages in `node_modules` are passed through Jetpack's JS compiler.                       |
| `assets`                | see below         | Asset handling options.                                                                                   |
| `define`                | `{}`              | Build-time constants for `rspack.DefinePlugin`. Values are JSON-serialized for you.                       |
| `proxy`                 | `{}`              | Dev proxy map, or a function that receives the Express app.                                               |
| `log`                   | `'info,progress'` | Log levels: `info`, `progress`, `all`, `silent`, or `none`.                                               |
| `rspack`                | `undefined`       | Function that receives the generated rspack config.                                                       |

Build options:

| Option                 | Default  | Description                                                  |
| ---------------------- | -------- | ------------------------------------------------------------ |
| `build.outDir`         | `'dist'` | Output directory relative to the project root. It must stay inside the project root and cannot be `'.'`. |
| `build.sourceMaps`     | dev only | Set `true` to force source maps, or `false` to disable them. Dev defaults to `'source-map'`; production defaults to `undefined`. |
| `build.minify`         | `true`   | Minify production JS and CSS.                                |
| `build.chunkLoadRetry` | `false`  | Enable retry runtime for failed async chunk loads with `true`, or configure it with `{ maxAttempts, base, multiplier }`. |

Asset options:

| Option               | Default | Description                                                  |
| -------------------- | ------- | ------------------------------------------------------------ |
| `assets.inlineLimit` | `8096`  | Maximum image asset size, in bytes, to inline as a data URL. |

Images under the inline limit are emitted as data URLs. Larger images, fonts, audio, and video are emitted as files.

HTML options:

| Option          | Default                     | Description                                          |
| --------------- | --------------------------- | ---------------------------------------------------- |
| `html.title`    | package name or `'jetpack'` | Page title for the default HTML shell.               |
| `html.cspNonce` | `false`                     | Add nonce placeholders to Jetpack-owned script tags. |
| `html.render`   | `null`                      | Custom HTML renderer function, or a static HTML string. |

CSS options:

| Option                                | Description                                                                |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `css.modules: false`                  | All CSS is global.                                                         |
| `css.modules: true`                   | App CSS is modular by default. `*.global.css` and `*.global.scss` opt out. |
| `css.modules: { conventional: true }` | Only `*.module.css` and `*.module.scss` opt in.                            |

Any other object keys under `css.modules` are passed to `css-loader`'s modules options.

## Polyfills

Jetpack transpiles JavaScript syntax for the configured browser target. Runtime APIs are handled separately through `core-js`:

```js
export default {
  // Inject only the core-js polyfills used by your code and required by your browser targets.
  polyfills: 'usage'
}

export default {
  // Rewrite explicit core-js entry imports for your browser targets.
  polyfills: 'entry'
}

export default {
  // Do not inject core-js polyfills. Your app owns runtime compatibility.
  polyfills: false
}
```

## Dependency Transpilation

Jetpack transpiles dependency JavaScript by default so npm packages are compiled for the configured browser target. Configure `transpileDependencies` to change that behavior:

```js
export default {
  // Current default: transpile dependency JS, except Jetpack runtime packages.
  transpileDependencies: true
}

export default {
  // Do not transpile dependency JS.
  transpileDependencies: false
}

export default {
  // Transpile only these packages.
  transpileDependencies: ['@acme/ui', 'modern-lib']
}

export default {
  // Transpile all dependency JS except these packages.
  transpileDependencies: {
    exclude: ['prebuilt-lib']
  }
}

export default {
  // Transpile only listed packages, with an explicit exclusion.
  transpileDependencies: {
    include: ['@acme/ui', 'modern-lib'],
    exclude: ['modern-lib']
  }
}
```

## HTML

Jetpack renders a small app shell by default. Production builds inline the Rspack runtime script into the HTML when one is emitted, but `manifest.json` only contains public asset URLs.

For full control, provide `html.render`:

```js
export default {
  html: {
    cspNonce: true,
    render: ({ html, title, tags, cspNonceAttr, mode, manifest }) => html`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          ${tags.css}
          ${mode === 'production'
            ? html`<script ${cspNonceAttr}>
                window.analytics = true
              </script>`
            : ''}
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

The render context includes the resolved config fields, plus `html`, `title`, `manifest`, `cspNonce`, `cspNonceAttr`, and pre-rendered `tags.css`, `tags.runtime`, and `tags.js`. The `html` helper is `String.raw`; it exists so editors can syntax-highlight HTML template literals. It does not escape interpolated values.

When `html.cspNonce: true` is set, Jetpack writes `__JETPACK_CSP_NONCE__` placeholders. Replace them per request:

```js
import { renderHtmlResponse } from 'jetpack/html'

res.send(renderHtmlResponse(indexHtml, { cspNonce: res.locals.cspNonce }))
```

If you use `serve(config)` and set `res.locals.cspNonce`, the middleware applies `renderHtmlResponse()` for HTML responses in both development and production.

## Define

Use `define` for build-time constants:

```js
export default {
  define: {
    __BUILD_ID__: '2026.05.20',
    'process.env.RELEASE_ENV': 'staging'
  }
}
```

Jetpack JSON-serializes each value before passing it to `rspack.DefinePlugin`, so strings should be written as normal strings, not pre-stringified values.

## Assets And CDN Paths

`assetBaseUrl` controls the URLs Jetpack writes into generated HTML and `manifest.json`:

```js
export default {
  assetBaseUrl: 'https://cdn.example.com/client-assets'
}
```

Jetpack normalizes it with a trailing slash and derives `assetBasePathname` from the pathname portion for dev middleware mounts.

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
config.target // 'modern', 'legacy', or 'all'
config.polyfills // 'usage', 'entry', or false
config.build.outDir
config.assetBaseUrl
config.assetBasePathname
```

`resolveConfig()` returns project config only. CLI command flags such as `--print-config`, `--yes`, `--dry-run`, and `--coverage` are not included. `jetpack build` writes emitted asset URLs to `${config.build.outDir}/manifest.json`; build assets do not live in the resolved config object.
