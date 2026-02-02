// Wrap EventSource to close HMR connections on page unload
// This prevents Firefox warning: "connection was interrupted while loading"
;(function () {
  var hmrSources = []
  var OriginalEventSource = window.EventSource
  window.EventSource = function (url, config) {
    var source = new OriginalEventSource(url, config)
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
