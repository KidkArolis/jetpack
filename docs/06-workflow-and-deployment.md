# Workflow and Deployment

A few common shapes for projects that use jetpack.

## Purely client-side

1. Develop with `jetpack`
2. Build with `jetpack build`
3. Deploy `dist/` to your static host

## Client + API in one project

Point `package.json#main` at the server entry and configure `entry` in `jetpack.config.js` for the client. Serve client assets via the API using `jetpack/serve`:

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

`serve(config)` proxies to the dev server in development and serves `dist/` in production. Run both processes via two terminals or your preferred process manager.

Deploy by building (`jetpack build`) and running `node .`.

## Client and API deployed separately

Deploy the client (`dist/`) to a CDN and the API to its own host. If the client calls the API at a relative path (e.g. `fetch('/api/unicorns')`), use jetpack's proxy in development:

```js
export default {
  proxy: {
    '/api/*': 'http://localhost:3000'
  }
}
```

In production, route `/api/*` requests to the API server at the CDN / load balancer.
