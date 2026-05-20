# Deployment

## Static Client

For a client-only app:

```sh
jetpack
jetpack build
```

Deploy `dist/`, or the directory configured as `build.outDir`, to your static host.

## Client And API

If the client and API live together, point `package.json#main` at the server entry and set the client `entry` in `jetpack.config.js`.

```js
import express from 'express'
import { resolveConfig } from 'jetpack'
import { serve } from 'jetpack/serve'

const app = express()
const config = await resolveConfig({
  command: process.env.NODE_ENV === 'production' ? 'build' : 'dev'
})

app.get('/api/unicorns', (req, res) => res.json([]))
app.use(serve(config))
```

In development, run the API server and `jetpack` in separate processes. `serve(config)` proxies to the dev server. In production, run `jetpack build` first and `serve(config)` serves `config.build.outDir`.

## Separate API

If the client and API deploy separately, use Jetpack's dev proxy:

```js
export default {
  proxy: {
    '/api/*': 'http://localhost:3000'
  }
}
```

In production, route `/api/*` at your CDN, load balancer, or application gateway.

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

Define `modern` and `legacy` browserslist environments:

```txt
[modern]
last 1 version
> 1%

[legacy]
> 0.1%
```

`jetpack build` writes `index.html` for modern browsers and `index.legacy.html` for legacy browsers. `serve(config)` chooses the right HTML file from the request user-agent.

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
