# Hot reloading

Hot reloading is on by default in development. Disable with `--no-hot` or `hot: false` in `jetpack.config.js`.

## CSS

Hot-reloaded automatically. Nothing to do.

## React

Components hot-reload via fast refresh (using [@rspack/plugin-react-refresh](https://github.com/rspack-contrib/rspack-plugin-react-refresh)). Nothing to do.

## Vanilla JS

For non-React code, accept HMR in your entry module:

```js
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  import.meta.webpackHot.dispose(() => {
    // perform cleanup
  })
}
```

Rspack will re-execute the changed module. If your app can re-render itself after `dispose()` runs, you'll get a clean hot-reload. Without `accept()`, only CSS hot-reloads; everything else requires a manual refresh.

## Gotcha: nodemon killing HMR

If your client and server live in the same project and you restart the server with `nodemon`, you may see this in the network panel:

```
GET /assets/__webpack_hmr  net::ERR_INCOMPLETE_CHUNKED_ENCODING
```

Nodemon restarts kill the HMR stream. Tell nodemon to ignore the client dir, e.g. `nodemon -i app/client .`.
