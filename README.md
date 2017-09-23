# jetpack 🚀

Build apps with 0 setup.

Rapidly **start**, **develop**, **build** and **release** production ready apps. Jetpack makes running browser JavaScript as easy as using `node .` Run `jetpack` and start hacking on your app.

Use `jetpack` to:

* **quickly run a bit of JavaScript in the browser**
* **build production ready client side only apps**
* **build production ready client and server apps**
* **bring your own client and server frameworks and libraries**

`jetpack` includes an opinionated, yet configurable, set of very simple defaults:

For the **client**:
- client side bundling powered by [webpack](https://webpack.js.org/)
- es6 code transpiled with [buble](https://buble.surge.sh/guide/)
- jsx is transpiled to h/React.createElement/Preact.h depending on what's installed
- use good ol css with autoprefixing with `require('./styles.css')`
- hot reload everything with `module.hot.accept()`
- fast to install, fast to use

For the **server**:

- server side reloading powered by [nodemon](github.com/nodemon/nodemon)
- use the very lightweight built in koa based server `jetpack/server` for rapid prototypes
- or use any server library of your choice and use `jetpack/handle` to handle the client side concerns seamlessly

![jetpack](https://cloud.githubusercontent.com/assets/324440/23823107/1e3336a4-0653-11e7-883e-2f6b9dbbc20b.png)

## Reasoning

One way to think of `jetpack` is to compare it to `rails`. It helps you start building apps quickly with all the sensible defaults, anyone could whip up a hello world or a blog in `rails` by following the tutorial. But then you can keep going and build out the app into production.

Another way to see `jetpack` is as a better `webpack-dev-server`. By better, I mean that `jetpack` is useful both for `dev` and `production`. The second way it's better is that it requires no configuration to get you started by providing sensible defaults.

Node is very cool in it's flexibility and very large ecosystem of approaches and libraries. But whenever someone new to node asked me . Even myself, I sometimes get frustrated when starting a project, since it's not very clear how to best arrange `webpack-dev-server`/`webpack-dev-middleware`/`express` server such that it's both convenient to develop and is still deployable.

* `next.js` - server side is a heavy tradeoff and not particularly beginner friendly when it comes to fetching data. The idea that some of the code gets bundled into the client and that you have to be careful about what you import in your React components makes it slightly trickier. It also prescribes the use of `React`, which isn't a bad of a thing, it's just that `jetpack` is more flexible in that sense.
* `bedrock` - it's much more prescriptive (more batteries included). I personally wouldn't choose it since I like to control my libraries much more.
* `neutrino` - client side only.
* `https://github.com/facebookincubator/create-react-app`

After taking all of this into consideration, the 2 goals for `jetpack` are:

* enable anyone to run any client side bit of code in the browser immediately with `jetpack script.js` the way you'd run a server side script with `node script.js`
* enable anyone to build a web app that has client side code and server side bits (which are so often useful) without having to learn or remember anything about best practises of setting up JS projects.

I'm aware, from my own experience, that sometimes it's hard to trust a "magical" tool that does stuff for you. But I've built `jetpack`, because I think there's a gap for very sensible default web app project approach in node.js ecosystem. I'm personally not a fan of boilerplates or generators, since they usually bring too much stuff into one place, I like to see and understand all the code, so I tend to prefer vanilla. But vanilla is quite tricky too when it comes to configuring a webpack project that also needs some server side bits.

## Usage

Install globally (or locally):

    yarn global add jetpack

    # or

    npm install -g jetpack

In your project, with package.json and/or index.js, start your app on http://localhost:3000:

    jetpack

To build the app for production to `dist` directory:

    jetpack build

To serve the app in production after it's been built, run:

    jetpack start

If you've reached a point where you want to switch away from using jetpack and jump into raw webpack (coming soon):

    jetpack unstrap

## Configuration

You can change some config in `jetpack.config.js` or via command line arguments:

```js
module.exports = {
    "port": 3000,
    "jsx": "h", // Preact.h/React.createElement if preact/react is installed
    "html": "./index.html", // if you want to change the default html served
    "public": "public" // if you want to reference assets like images,
    "client": "client" // the directory with the client code, ignored by nodemon
    "server": "server" // the directory with the server code,

    "quiet": "no jetpack logs, only errors and logs from the app",
    "verbose": "more detailed logs, restarts, detailed webpack stats"
}
```

## Hot reloading

CSS is hot reloaded automatically. For JavaScript you need a bit of code. E.g. in your main render module or entry point, you should accept hot reloads, which will rerender your app. You'll want to store the state on window or in localStorage if you want the app to remain in the same state after rerendering.

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

*(coming soon)*

You can extend the default webpack config using `jetpack.config.js`:

```js
module.exports = {
  webpack: (config, { dev }) => {
    // Perform customizations to webpack config
    // Important: return the modified config
    return config
  },
  webpackDevMiddleware: config => {
    // Perform customizations to webpack dev middleware config
    // Important: return the modified config
    return config
  }
}
```

## FAQ

* **Is this meant to replace webpack?** No.
* **So when should I use this?** When you want to run a snippet of code in the browser, when you want to try an npm package, when you have an idea for an app and want to start hacking on it right away (instead of spending time setting up boilerplate), when you're live coding in a talk.
* **Should I use it for production apps?** Absolutely, that's the idea.
* **What about [Neutrino from Mozilla](https://neutrino.js.org/) or [ratpack](https://github.com/threepointone/ratpack)?** Neutrino seems awesome, I hope it takes off. I'd like to look into integrating Jetpack with Neurtino if that makes sense. Neutrino is a more ambitious approach of improving webpack's API for production apps. Jetpack is more about seamlessly running a bit of JS in the browser. Definitely an inspiration for jetpack. It's pretty much the same idea. You should try it.
* **Can I use babel?** Yes, but you'll have to customize the webpack config yourself using `jetpack.config.js`. For server, I personally wouldn't recommend using `babel` since I'm not sure it adds much, but 
* **Can I use TypeScript or Flow?** Hm, haven't figured this one out atm.
* **Can I use `jetpack` with a different server side language** Yeah, run your client side code server with `jetpack` and load `http://localhost:3000/bundle.js` in your server project. Alternatively use the proxy feature.
* **I want to do server side rendering** That can be tricky. You can do it with `jetpack`, but there isn't any special help provided. Your best bet might be to use `next` in this case.
