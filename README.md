<p align="center">
  <img src="https://user-images.githubusercontent.com/324440/48484676-a1690280-e80e-11e8-9835-14c6b0c5bb98.png" alt="jetpack" title="jetpack">
</p>

<h4 align="center">Run and build web code with Rspack.</h4>
<br />

Jetpack is preconfigured Rspack for web code: one command to start a dev server, one command to build production assets, and a config file only when you need it.

```sh
npm install -g jetpack
jetpack
jetpack build
```

Jetpack requires Node 20 or newer and is published as ESM.

## What You Get

- JavaScript, TypeScript, JSX, CSS, SCSS, and assets
- SWC, core-js polyfills, and Lightning CSS
- Hot reloading, including React fast refresh
- Content-hashed production builds with code splitting and an asset manifest
- Optional modern/legacy differential builds
- Dev proxying, static serving middleware, and CSP nonce helpers
- A small config file when defaults are not enough

## Usage

Start a dev server on `http://localhost:3030`:

```sh
jetpack
```

Build into `dist/`:

```sh
jetpack build
```

Point Jetpack at another file or project:

```sh
jetpack ~/Desktop/magic.js
jetpack --dir ~/projects/app
```

Inspect, clean, or check browser targets:

```sh
jetpack inspect
jetpack clean --dry-run
jetpack browsers --coverage=GB
```

## Configuration

Most projects do not need config. When you do, add `jetpack.config.js`, `jetpack.config.mjs`, or `jetpack.config.cjs`. Keep common app options top-level and put build/HTML shell settings under `build` and `html`.

```js
import { defineConfig } from 'jetpack'

export default defineConfig({
  entry: '.',
  port: 3030,
  assetBaseUrl: '/assets/',

  dev: {
    overlay: true
  },

  build: {
    outDir: 'dist',
    chunkLoadRetry: true
  },

  html: {
    title: 'my-app'
  },

  css: {
    modules: true
  }
})
```

## API Servers

Mount Jetpack into your own server after the API routes:

```js
import { serve } from 'jetpack/serve'

app.get('/api/unicorns', (req, res) => res.json([]))
app.use(serve())
```

`serve()` resolves Jetpack config on the first request and caches the middleware. It uses `process.cwd()` as the default project directory, proxies to the Jetpack dev server outside production, and serves `build.outDir` in production. For monorepos, pass the client directory:

```js
app.use(serve({ dir: clientDir }))
```

## Docs

- [Configuration](./docs/configuration.md)
- [Deployment](./docs/deployment.md)
- [Advanced](./docs/advanced.md)
