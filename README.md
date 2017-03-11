# jetpack

0 setup. Run `jetpack` and start hacking on your app.

Includes an opinionated set of very simple defaults:

- powered by [webpack](https://webpack.js.org/)
- es6 code transpiled with [buble](https://buble.surge.sh/guide/)
- jsx transpiled to React/Preact depending on what's installed
- use good ol regular css with `require('./styles.css')`, includes autoprefixing
- hot reload everything with `module.hot.accept()`
- fast to install, fast to use

## Usage

Install globally:

        yarn global add jetpack

In your project, with package.json or index.js, start your app on http://localhost:3000:

        jetpack

To build the app for production to `dist` directory (coming soon).

        jetpack build

## Settings

You can change some settings in `package.json` or via command line arguments:

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
