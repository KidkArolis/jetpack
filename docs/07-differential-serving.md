# Differential bundling and serving

Jetpack can produce two bundles — a _modern_ and a _legacy_ one — and serve each to the appropriate browser. Modern browsers get smaller, less-transpiled JS.

## Modern by default

Out of the box, jetpack only builds a modern bundle. No differential serving needed — point `jetpack/serve`, `express.static`, Nginx, or your CDN at `dist/` and you're done.

## Differential builds

Build both bundles via CLI:

```
jetpack build --target all
jetpack build -t all
```

…or in `jetpack.config.js`:

```js
export default {
  target: { modern: true, legacy: true }
}
```

Define which browsers count as modern vs legacy with a browserslist config using `modern` and `legacy` environments:

```
[modern]
> 10%

[legacy]
> 0.1%
```

`jetpack build` then emits `index.html` (modern) and `index.legacy.html` (legacy), each pointing at the appropriate bundle. You're responsible for serving the right one to each browser.

## Differential serving

`jetpack/serve` does it for you — it sniffs the user-agent and serves the modern or legacy HTML accordingly.

```js
import express from 'express'
import jetpack from 'jetpack/serve'

const app = express()
app.get('/api/data', (req, res) => res.send('hello'))
app.use(jetpack)
app.listen(3000)
```

This pulls all of jetpack (rspack, swc, sass-embedded, etc.) into your production runtime. If that's a concern, install jetpack as a devDependency and use the standalone [`jetpack-serve`](https://github.com/KidkArolis/jetpack-serve) package in production.

## Browsers command

To see what each bundle will target:

```
$ jetpack browsers
$ jetpack browsers --coverage=GB
$ jetpack browsers --target all
```
