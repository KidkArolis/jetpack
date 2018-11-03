<h1 align="center">
  <img src="https://user-images.githubusercontent.com/324440/36952908-871e050c-200d-11e8-83eb-12d29fef261f.jpg" alt="jetpack" title="jetpack">
</h1>

<h5 align="center">A more convenient webpack dev server</h5>
<br />

Jetpack wraps webpack to make running browser JavaScript as easy as running `node script.js`.

Use `jetpack` to:

* quickly run any bit of JavaScript in the browser
* build production ready web apps

Why use `jetpack`? To avoid rolling your own custom webpack config or copy pasting it from another project. Jetpack has a good set of defaults that should get you off the ground quickly. And with the universal `jetpack/handle` middleware you don't have to worry about wiring up webpack dev middleware or dev server - everything _just works_.

## Features

* **sensible** webpack defaults
* **es6+ compiled** with `@babel/preset-env` without any need for `.babelrc`
* **jsx compiled** to `React.createElement` or `h` depending on what npm packages are installed
* **css** compiled with `postcss-preset-env`
* **hot reloading** built in
* **automatic chunk splitting** in production bundles
* **use any server framework** and seamlessly handle webpack assets in dev and production with `jetpack/handle`
* **close to the metal** - unlike create-react-app, next.js or gatsby – there's no framework here

## Usage

Install globally:

    $ npm install -g jetpack

In your project with `package.json` or `index.js`, start your app on `http://localhost:3030`:

    $ jetpack

Alternatively, point `jetpack` to any js file on your machine:

    $ jetpack ~/Desktop/magic.js

To build the app for production to `dist` directory:

    $ jetpack build

To serve the app in production after it's been built, run:

    $ jetpack serve

If you've reached a point where you want to switch away from using jetpack and jump into raw webpack (*coming soon*):

    $ jetpack unstrap

## Configuration

You can change config by using `jetpack.config.js` or command line arguments:

```js
module.exports = {
  port: 3000,
  jsx: "React.createElement" | "h", // if react is installed, h otherwise
  client: "./app/client", // the directory with the client code
  static: "./static", // if you want to serve assets like images
  dist: "dist", // the dir for building production client side code

  title: "pkg name", title of the html page
  html: "custom ejs template string", // if you want to change the default html served
  head: "", // string of html to add to head, e.g. analytics script
  body: `<div id="root"></div>, // string of html to add to top of the body

  hot: true // toggle hot reloading,
  quiet: false, // no jetpack logs, only errors and logs from the app
  verbose: false, // more detailed logs,

  // specify browser list using https://github.com/browserslist/browserslist syntax
  browsers: [
    '>1%',
    'last 4 versions',
    'Firefox ESR',
    'not ie < 9' // React doesn't support IE8 anyway
  ],

  css: {
    modules: false, // set true to use css modules
    features: {
      // specify postcss-css-env rules to add,
      // in addition to all of the stage 2 features
      // e.g. "nesting-rules": true
    }
  }
}
```

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

## Hot reloading

CSS is hot reloaded automatically. For JavaScript you need a bit of code. E.g. in your main render module or entry point, you should accept hot reloads, which will rerender your app. You'll want to store the state on window or in localStorage if you want the app to remain in the same state after rerendering. If `module.hot.accept` is not called, the entire page will be reloaded. You can disable hot reloading entirely by passing `--no-hot` to jetpack or setting `hot: false` in your `jetpack.config.js`.

```js
if (module.hot) {
  module.hot.accept()
  module.hot.dispose(() => {
    // perform cleanup
  })
}
```

Server side code is reloaded using `nodemon`.

## Custom webpack loaders

You can extend the default webpack config using `jetpack.config.js`:

```js
// jetpack exposes it's webpack so you could use webpack's plugins
const webpack = require('jetpack/webpack')

module.exports = {
  webpack: (config, options) => {
    // perform customizations to webpack config

    config.module.rules.push({
      test: /\.png|\.svg$/,
      use: 'file-loader'
    })

    config.plugins.push(
      new webpack.NamedModulesPlugin()
    )

    // important: return the modified config
    return config
  }
}
```

## Workflow

### Aproach 1 – client and server separate – JAMStack approach

Jetpack is just for your client app. Serves all the things.

jetpack dev server running on 3030
  in dev -> connect to api at localhost:3000 with CORS
  in prd -> connect to api at api.service.com with CORS

### Aproach – your server serves clientside assets via jetpack-handle

When you're building a node server as your main entry point and want to handle assets too.
Separate, optional package for serving up jetpack assets in dev and and prod.

  in dev -> proxies to 3030
  in prd -> serves build assets

### Development experience

In both cases, in development you need to run jetpack and your api server. You can run them in 2 separate terminals, which is good for clear separation of the log output and independent watching with nodemon.

Alternatively, if you want to run both at the same time, use something like `nf` with Procfile.

Alternatively, jetpack has a flag to run `npm start` or command configured in `jetpack.config.js` under `server`, which runs both jetpack and server. 

jetpack --server


## FAQ

**Is this meant to replace webpack?** No. It's an exploration of a better developer experience for using webpack.

**When should I use this?** When you want to run a snippet of code in the browser. When you want to try an npm package. When you're live coding in a talk. When you have an idea for an app and want to start hacking on it right away instead of spending time setting up boilerplate. Any time you'd reach for webpack otherwise.

**Should I use it for production apps?** Absolutely, that's the idea.

**Can I use TypeScript or Flow?** Yes, by including the required webpack loader via `jetpack.config.js`.

**I want to do server side rendering** You can do it with `jetpack`, but there isn't any special help provided. You can render your own html in your custom server. In general, your best bet might be to use something like [next.js](https://github.com/zeit/next.js) in this case.

**Where's that cool banner photo from?** It's a photo by [SpaceX](https://unsplash.com/photos/-p-KCm6xB9I?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on the awesome [Unsplash](https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText).
