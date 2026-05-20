<p align="center">
  <img src="https://user-images.githubusercontent.com/324440/48484676-a1690280-e80e-11e8-9835-14c6b0c5bb98.png" alt="jetpack" title="jetpack">
</p>

<h4 align="center">Rspack made more convenient.</h4>
<br />

**Jetpack wraps rspack** to give you a smooth dev experience without writing a config. It can be extended with arbitrary rspack configuration if you outgrow the defaults.

- **Sensible defaults** for JavaScript, CSS, and assets.
- **Preconfigured swc-loader** for speedy compilation.
- **Preconfigured core-js** for polyfilling missing browser features.
- **Preconfigured lightningcss** for CSS syntax lowering.
- **Modern bundles by default** with no async/await transpilation.
- **Differential builds** — modern/legacy bundles served by user-agent.
- **CSS modules** one config flag away.
- **SCSS** preconfigured.
- **JSX and TypeScript** detection out of the box.
- **Hot reloading** via React fast-refresh and for vanilla JS/CSS.
- **Automatic chunk splitting** with inlined runtime.
- **Single dependency**.

## Why jetpack?

Plenty of bundler tools exist — Vite, Parcel, Next.js, esbuild — each tuned for a different workflow. Jetpack's angles:

- **Run-anywhere CLI.** Install globally and point jetpack at any file or directory: `jetpack ~/Desktop/script.js` works just like `node ~/Desktop/script.js`. Useful for one-off hacks _and_ full projects alike.
- **Production-ready out of the box.** Content-hashed assets, code splitting with inlined runtime, modern + legacy differential bundles, browser-targeted polyfills — all preconfigured. Extensible if you outgrow it.
- **One dependency.** Wraps rspack + swc + lightningcss + sass-embedded into a single, cohesive install.

For server-side rendering, reach for Next.js. For mostly-static content, Astro.

## Usage

Install globally or locally:

    $ npm install -g jetpack

In your project, start your app on `http://localhost:3030`:

    $ jetpack

Build for production into `dist/`:

    $ jetpack build

Inspect the bundle:

    $ jetpack inspect

Print supported browsers:

    $ jetpack browsers
    $ jetpack browsers --coverage=GB

## Use jetpack anywhere

Install jetpack globally and point it at any file or directory:

    $ jetpack ~/Desktop/magic.js
    $ jetpack --dir ~/projects/manyverse

## Use jetpack with an API

Two common patterns:

**Proxy from jetpack to your API in dev.** Run your API on `:3000`, jetpack on `:3030`, and forward `/api/*` requests:

```js
// jetpack.config.js
export default {
  proxy: { '/api/*': 'http://localhost:3000' }
}
```

**Mount jetpack into your own server** using `jetpack/serve` — proxies to the dev server in development, serves built files in production:

```js
import { resolveConfig } from 'jetpack'
import { serve } from 'jetpack/serve'

const config = await resolveConfig({
  command: process.env.NODE_ENV === 'production' ? 'build' : 'dev'
})
app.use(serve(config))
```

See [Workflow and deployment](./docs/06-workflow-and-deployment.md).

## Documentation

- [All configuration options](./docs/01-configuration-options.md)
- [Customizing Rspack](./docs/02-customizing-rspack.md)
- [Customizing SWC](./docs/03-customizing-swc.md)
- [Customizing Browserslist](./docs/05-customizing-browserslist.md)
- [Workflow and deployment](./docs/06-workflow-and-deployment.md)
- [Differential serving](./docs/07-differential-serving.md)
- [Hot reloading](./docs/08-hot-reloading.md)
