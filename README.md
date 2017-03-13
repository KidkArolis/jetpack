# jetpack 🚀

0 setup.

Jetpack makes running browser JavaScript as easy as using `node .` Run `jetpack` and start hacking on your app.

Includes an opinionated set of very simple defaults:

- powered by [webpack](https://webpack.js.org/)
- es6 code transpiled with [buble](https://buble.surge.sh/guide/)
- jsx transpiled to React/Preact depending on what's installed
- use good ol css with `require('./styles.css')`, includes autoprefix
- hot reload everything with `module.hot.accept()`
- fast to install, fast to use

![jetpack](https://cloud.githubusercontent.com/assets/324440/23823107/1e3336a4-0653-11e7-883e-2f6b9dbbc20b.png)

## Usage

Install globally (or locally):

    yarn global add jetpack

In your project, with package.json or index.js, start your app on http://localhost:3000:

    jetpack

To build the app for production to `dist` directory:

    jetpack build

If you've reached a point where you want to switch away from using jetpack and jump into raw webpack (coming soon):

    jetpack unstrap

## Configuration

You can change some config in `package.json` or via command line arguments:

```js
{
    "jetpack": {
        "port": 3000,
        "jsx": "React.createElement", // or Preact.h if preact is installed
        "html": "./index.html", // if you want to change html that's served
        "public": "public" // if you want to reference assets like images
    }
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

## FAQ

* **Is this meant to replace webpack?** No.
* **So when should I use this?** When you want to run a snippet of code in the browser, when you want to try an npm package, when you have an idea for an app and want to start hacking on it right away (instead of spending time setting up boilerplate), when you're live coding in a talk.
* **Should I use it for production apps?** You could, it's just that if you reach a point where the defaults don't work for your specific case, you might want to `unstrap` and tweak the webpack config at that point.
* **What about [Neutrino from Mozilla](https://neutrino.js.org/)?** Neutrino seems awesome, I hope it takes off. I'd like to look into integrating Jetpack with Neurtino if that makes sense. Neutrino is a more ambitious approach of improving webpack's API for production apps. Jetpack is more about seamlessly running a bit of JS in the browser.
* **What about [ratpack](https://github.com/threepointone/ratpack)?** Definitely an inspiration for jetpack. It's pretty much the same idea. You should try it.
* **What about support for less/sass/svg/images/angular/vue/...?** Post an issue and we can try to integrate if it makes sense. It obviously might not be possible to achieve a universal webpack setup, but let's see where we can take this.
