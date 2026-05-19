// Wrap EventSource to close HMR connections on page unload.
// Prevents Firefox warning: "connection was interrupted while loading".
//
// `export {}` marks this as an ES module so swc's env preset emits polyfill
// imports as `import 'core-js/...'` rather than `require('core-js/...')` —
// rspack treats this file as ESM (it adds `__webpack_require__.r` because of
// the React Refresh wrapping), and bare `require()` calls aren't rewritten.
export {}
;(function () {
  const hmrSources = []
  const OriginalEventSource = window.EventSource
  window.EventSource = function (url, config) {
    const source = new OriginalEventSource(url, config)
    if (url && url.indexOf('__webpack_hmr') !== -1) {
      hmrSources.push(source)
    }
    return source
  }
  window.EventSource.prototype = OriginalEventSource.prototype
  Object.defineProperty(window.EventSource, 'CONNECTING', { value: 0 })
  Object.defineProperty(window.EventSource, 'OPEN', { value: 1 })
  Object.defineProperty(window.EventSource, 'CLOSED', { value: 2 })
  window.addEventListener('beforeunload', function () {
    hmrSources.forEach(function (source) {
      source.close()
    })
  })
})()
