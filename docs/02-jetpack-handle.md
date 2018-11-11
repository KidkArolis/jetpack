## jetpack/handle

When you want to use your own server, you can plug jetpack right into any server that works with node's standard request/response objects, e.g.:

```js
const express = require('express')
const { handle, options } = require('jetpack/handle')

const app = express()

app.get('/api/data', (req, res) => {
  res.send({ data: Date.now() })
})

// this serves the html page with the right script tags
// and the client assets
app.get('*', handle)

app.listen()
```

Alternatively, you can only serve the client assets and render the html page yourself:

```js
const { handle, options } = require('jetpack/handle')

app.get('/client/*', handle)

app.get('*', (req, res) => {
  res.send(`
    <body>
      ${options.assets.map(asset =>
        `<script type='text/javascript' src='${asset}'></script>`
      ).join('\n')}
    </body>
  `)
})
```

Alternatively, do the above in development only, and serve the client assets from a CDN, which case it's up to you how you upload the built assets and how to serve them. Check out [bapistrano](https://github.com/QubitProducts/bapistrano) - a tool for uploading and serving long term cached assets from S3 with feature branch support.
