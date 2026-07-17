# Deployment

## Static Client

For a client-only app:

```sh
jetpack
jetpack build
```

Deploy `dist/`, or the directory configured as `build.outDir`, to your static host.

Set `assetBaseUrl` when assets are served from a sub-path or CDN:

```js
export default {
  assetBaseUrl: 'https://cdn.example.com/client-assets'
}
```

## Client And API

If the client and API live together, point `package.json#main` at the server entry and set the client `entry` in `jetpack.config.js`.

```js
import express from 'express'
import { serve } from 'jetpack/serve'

const app = express()

app.get('/api/unicorns', (req, res) => res.json([]))
app.use(serve())
```

In development, run the API server and `jetpack` in separate processes. `serve()` resolves Jetpack config on the first request and caches the middleware. It defaults to `process.cwd()` for the project directory, proxies to the dev server outside production, and returns a helpful 502 HTML page for browser requests if the dev server is not running. In production, run `jetpack build` first and `serve()` serves `build.outDir`.

For monorepos where the API server and client app live in different packages, pass the client directory:

```js
app.use(serve({ dir: clientDir }))
```

If you enable `html.cspNonce`, set `res.locals.cspNonce` before `serve()` runs. The middleware replaces Jetpack's nonce placeholders in development and production HTML responses.

## Separate API

If the client and API run on separate origins, configure CORS on the API or use a dedicated reverse proxy. In production, route API requests at your CDN, load balancer, or application gateway.

## Differential Builds

Jetpack builds a modern bundle by default. To emit both modern and legacy bundles:

```sh
jetpack build --target all
```

Or configure it:

```js
export default {
  target: 'all'
}
```

Define `modern` and `legacy` Browserslist environments so the two bundles target different browsers. A regular Browserslist config applies to both bundle targets.

```txt
[modern]
baseline widely available with downstream

[legacy]
defaults
```

`jetpack build` writes `index.html` for modern browsers and `index.legacy.html` for legacy browsers. `serve()` chooses the right HTML file from the request user-agent.

To inspect browser targets:

```sh
jetpack browsers
jetpack browsers --coverage=GB
jetpack browsers --target all
```

## Manifest

`jetpack build` writes `${build.outDir}/manifest.json`:

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

Each target key contains public `js`, `css`, `runtime`, and `other` arrays. The runtime may be inlined into `index.html`, so `manifest.json` intentionally omits Jetpack's internal `inlineRuntime` field.
