const browserslist = require('browserslist')

// These are browserslist defaults
// + browsers supporting es modules according to babel-preset-env
// - browsers that don't support async/await properly
//
// The point here is to have an evergreen, modern browser support
// but eagerly exclude all the browsers that are still quite new
// but don't support async/await fully. This avoids transpiling
// async/await. Eventually this can be simplified back to browserslist
// default, but for now this is what it takes.
//
// This approach is an alternative to module/nomodule approach.
// While module/nomodule approach is a specific cut in time, where
// certain browsers started supporting es modules, that cut will remain
// static unless new specs for versioning script tags is introduced.
//
// As browsers continue adding new features, this browserslist will
// continue polyfilling less and less. We therefore need to do
// user agent parsing and serve the appropriate html file based
// on this very browserslist.

const jetpackDefaultBrowserslist = {
  modern: [
    '> 0.5% and last 2 versions',
    'Firefox ESR',
    'not dead',
    'not edge < 16',
    'not firefox < 60',
    'not chrome < 61',
    'not safari < 12',
    'not opera < 48',
    'not ios_saf < 11.4',
    'not and_chr < 71',
    'not and_ff < 64',
    'not ie <= 11'
  ].join(', '),
  legacy: undefined
}

module.exports = function browsers (options) {
  const browserslistEnv = options.modern ? 'modern' : 'legacy'
  let browsers = browserslist.loadConfig({ env: browserslistEnv, path: '.' })
  browsers = browsers || jetpackDefaultBrowserslist[browserslistEnv]
  return browsers
}

module.exports.browserslist = jetpackDefaultBrowserslist
