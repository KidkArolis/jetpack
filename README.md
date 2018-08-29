<h1 align="center">
  <img src="https://user-images.githubusercontent.com/324440/36952908-871e050c-200d-11e8-83eb-12d29fef261f.jpg" alt="jetpack" title="jetpack">
</h1>

<h5 align="center">Start building browser apps with zero config</h5>
<br />

Rapidly **start**, **develop**, **build** and **release** production ready apps. Jetpack makes running browser JavaScript as easy as running `node script.js`. Jetpack wraps webpack and nodemon to give you the quickest development workflow.

Use `jetpack` to:

* run a bit of JavaScript in the browser
* build production ready client only apps
* build production ready client/server apps

Why use `jetpack`? To avoid rolling your own custom webpack config or copy pasting it from another project. Jetpack has a good set of defaults that should get you off the ground immediately. And with the universal `jetpack/handle` middleware you don't have to worry about wiring up webpack dev middleware or dev server - everything _just works_.

## Features

* **close to the metal** - no framework here, what you write is what you get
* **sensible** yet configurable webpack defaults
* **es6+ compiled** with @babel/preset-env without any need for `.bablerc`
* **jsx compiled** to `React.createElement` or `h` depending on what's installed
* **css** compiled with postcss-preset-env
* **css modules** for files named `*.module.css`
* **hot reloading** built in
* **automatic chunk splitting** in production bundles
* **nodemon** for server code reloading
* **server code** is completely optional
* **express wrapper** built in `jetpack/server` for rapid prototyping
* **use any server framework** and seamlessly handle webpack assets in dev and production with `jetpack/handle`

## Architecture

Jetpack brings together a common pattern into a single command. It streamlines the dev and production flows for JavaScript projects.

**Develop browser packages**. Compiles the specified file and all it's dependencies and serves it up using the dev server.

    $ jetpack ./some/module.js

**Develop browser packages**. Compiles the specified file and all it's dependencies and serves it up using the dev server.

    $ jetpack ./some/module.js

## Reasoning

One way to think about `jetpack` is as a better `webpack-dev-server`. Jetpack useful for both `dev` and `production` and requires no configuration to get you started.

Node is very cool in it's flexibility and very large ecosystem of approaches and libraries. But whenever someone new to node asked me - "how do you build a web app?", I sigh. Even as an experienced JavaScripter I get frustrated when starting new projects, since it's not very clear how to best arrange `webpack-dev-server`/`webpack-dev-middleware`/`express` server such that it's both convenient to develop and easy to deploy.

The 2 goals of `jetpack` are:

* Enable anyone to run any client side bit of code in the browser immediately with `jetpack script.js` the way you'd run a server side script with `node script.js`.
* Enable anyone to build a web app that has client side code and server side bits (which are so often useful) without having to learn or remember anything about best practises of setting up JS projects.

I built `jetpack`, because I think there's a gap in the ecosystem for a sensible default web app project setup.

## Usage

Install globally:

    npm install -g jetpack

In your project with `package.json` or `index.js`, start your app on `http://localhost:3000`:

    jetpack

Alternatively, point `jetpack` to any js file on your machine:

    jetpack ~/Desktop/magic.js

To build the app for production to `dist` directory:

    jetpack build

To serve the app in production after it's been built, run:

    jetpack start

If you've reached a point where you want to switch away from using jetpack and jump into raw webpack (*coming soon*):

    jetpack unstrap

## Configuration

You can change config by using `jetpack.config.js` or command line arguments:

```js
module.exports = {
  port: 3000,
  jsx: "React.createElement" | "h", // if react is installed, h otherwise
  client: "./app/client", // the directory with the client code, ignored by nodemon
  server: "./app/server", // the directory with the server code
  static: "./static", // if you want to serve assets like images
  dist: "dist", // the dir for building production client side code
  html: "./index.html", // if you want to change the default html served
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
    features: {
      // specify postcss-css-env rules to add,
      // in addition to all of the stage 2 features
      // e.g. "nesting-rules": true
    }
  }
}
```

## jetpack/server

For realy simple prototypes of initial versions of your app, jetpack comes with a small express wrapper:

```js
const server = require('jetpack/server')

const app = server()

app.get('/api/data', (req, res) => {
  res.send({ data: Date.now() })
})

app.listen()
```

See [examples/basic-client-and-server](examples/basic-client-and-server) for a working example.

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

## FAQ

**Is this meant to replace webpack?** No. It's an exploration of a better developer experience for using webpack.

**When should I use this?** When you want to run a snippet of code in the browser. When you want to try an npm package. When you're live coding in a talk. When you have an idea for an app and want to start hacking on it right away instead of spending time setting up boilerplate. Any time you'd reach for webpack otherwise.

**Should I use it for production apps?** Absolutely, that's the idea.

**Can I use TypeScript or Flow?** Yes, by including the required webpack loader via `jetpack.config.js`.

**I want to do server side rendering** You can do it with `jetpack`, but there isn't any special help provided. You can render your own html in your custom server. In general, your best bet might be to use something like [next.js](https://github.com/zeit/next.js) in this case.

**Where's that cool banner photo from?** It's a photo by [SpaceX](https://unsplash.com/photos/-p-KCm6xB9I?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on the awesome [Unsplash](https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText).
