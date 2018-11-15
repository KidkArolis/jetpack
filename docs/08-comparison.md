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