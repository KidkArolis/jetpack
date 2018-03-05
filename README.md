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

## Convention over configuration

`jetpack` includes an opinionated, yet configurable, set of defaults.

For the **client**:
- client side bundling powered by [webpack](https://webpack.js.org/)
- es6 code transpiled with [babel](https://babeljs.io/) with [babel-preset-env](https://babeljs.io/docs/plugins/preset-env/)
- jsx is transpiled to h/React.createElement/Preact.h depending on what's installed
- use good ol css with autoprefixing with `require('./styles.css')`
- hot reload everything with `module.hot.accept()`

For the **server**:

- development reloading powered by [nodemon](github.com/nodemon/nodemon)
- use the lightweight built in express based server `jetpack/server` for rapid prototypes
- or use any server library of your choice and use `jetpack/handle` to handle the client side concerns seamlessly

## Architecture

Jetpack brings together a common pattern into a single command. It streamlines the dev and production flows for JavaScript projects.

![architecture](https://user-images.githubusercontent.com/324440/34653944-29e868a2-f3ec-11e7-9a2e-994da2a2cda7.png)

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
  jsx: "React.createElement" | "Preact.h", // if (p)react is installed
  client: "client", // the directory with the client code, ignored by nodemon
  server: "server", // the directory with the server code
  static: "static", // if you want to serve assets like images
  dist: "dist", // the dir for building production client side code
  html: "./index.html", // if you want to change the default html served
  hot: true // toggle hot reloading,
  quiet: false, // no jetpack logs, only errors and logs from the app
  verbose: false, // more detailed logs
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
