<p align="center">
  <img src="https://user-images.githubusercontent.com/324440/48484676-a1690280-e80e-11e8-9835-14c6b0c5bb98.png" alt="jetpack" title="jetpack">
</p>

<h4 align="center">Rspack made more convenient.</h4>
<br />

Jetpack is Rspack with the defaults already chosen. It runs a dev server, builds production assets, and stays out of your way until you need an escape hatch.

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

Proxy API requests during development:

```js
export default {
  proxy: {
    '/api/*': 'http://localhost:3000'
  }
}
```

Or mount Jetpack into your own server:

```js
import { resolveConfig } from 'jetpack'
import { serve } from 'jetpack/serve'

const config = await resolveConfig({
  command: process.env.NODE_ENV === 'production' ? 'build' : 'dev'
})

app.use(serve(config))
```

In development, `serve(config)` proxies to the Jetpack dev server. In production, it serves `build.outDir` and chooses modern or legacy HTML when both bundles exist.

## Docs

- [Configuration](./docs/configuration.md)
- [Deployment](./docs/deployment.md)
- [Advanced](./docs/advanced.md)
