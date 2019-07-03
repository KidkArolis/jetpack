# Differential serving

Jetpack supports differential building and serving. That is it can produce 2 bundles instead of just one - modern and legacy. An appropriate bundle can be served to each browser. This ensures that modern browsers get smaller and more efficient bundles. This also can speed up development builds.

## Modern by default

By default, jetpack only compiles for modern browsers. This is the simplest way to use jetpack since you don't have to worry about how to do differential serving. You can simply use `express.static`, nginx or CDN to serve your bundles.

You can still tweak what browsers are targeted if you would like to support more browser's that jetpack's default by creating a custom `.browserslistrc`, e.g.:

```
defaults
```

or

```
>0.5%
```

## Differential builds

However, you can also build both modern and legacy bundles using cli args:

```
jetpack build --modern --legacy
jetpack build -ml
```

Or by configuring it in your `jetpack.config.js`:

```
module.exports = {
  target: {
    modern: true,
    legacy: true
  }
}
```

To tweak what browsers are considered modern and legacy, use `.browserslistrc` with `modern` and `legacy` environments:

```
[modern]
> 10%

[legacy]
> 0.1%
```

Running a jetpack built with legacy turned on will produce `index.html` pointing to `bundle.js` and `index.legacy.html` pointing to `bundle.legacy.js`. Now you need to know which index file to serve to which browsers.

## Differential serving

Jetpack opts to not use module/no module approach due to it's 2 limitations:

1. Currently module/no module option in `@babel/preset-env` transpiles async/await into regenerator and that's not desired for modern browsers.
2. The browsers that support ES modules will eventually get old, and by using browser detection to serve the right bundle we can keep transpiling less and less over time.

To do the differential serving you can use `jetpack/serve` module or the standalone [`jetpack-serve`](https://github.com/KidkArolis/jetpack-serve) package.

### jetpack/serve module

```js
const express = require('express')
const jetpack = require('jetpack-serve')

const app = express()

app.get('/api/data', (req, res) => {
  res.send('hello')
})

// this will work in both production and development
// in development it proxies to jetpack's dev serve
// in production it will detect if browser is modern
// or legacy and serve an appropriate entry point
app.get('*', require('jetpack/serve'))

app.listen(3000, function() {
  console.log('Running server on http://localhost:3000')
})
```

This is the most convenient option, but can be undesirable if you'd like to avoid shipping the entire jetpack package with all of it's dependencies (i.e. webpack, babel, postcss, etc.) to your production apps. To avoid that, consider installing `jetpack` as a dev dependency and using the standalone `jetpack-serve` package instead.

### jetpack-serve package

```js
const express = require('express')
const jetpack = require('jetpack-serve')

const app = express()

app.get('/api/data', (req, res) => {
  res.send('hello')
})

// this will work in both production and development
// in development it will require('jetpack/serve'), so
// you will have to have jetpack installed
// in production it will detect if browser is modern
// or legacy and serve an appropriate entry point and use
// express.static for the actual assets
app.use(jetpack())

app.listen(3000, function() {
  console.log('Running server on http://localhost:3000')
})
```

Or if you're using something other than express or want to customise the behaviour, you can use the UA regex directly:

```js
const jetpack = require('jetpack-serve')

if (jetpack.regexp({ modern: true }).test(req.headers['user-agent'])) {
  return 'serve modern'
} else {
  return 'serve legacy'
}
```

## Browsers command

To see what browsers your modern or legacy bundles will target, jetpack provides a `jetpack browsers` command:

```
$ jetpack browsers

[modern query]
> 0.5% and last 2 versions

[modern browsers]
chrome 74
edge 18
edge 17
firefox 66
firefox 60

[modern coverage globally]
77.88%
```
