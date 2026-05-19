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

**Why use jetpack?** To avoid rolling your own rspack config or pasting one from project to project. With the `proxy` option or the `jetpack/serve` middleware you don't have to worry about wiring up dev middleware — everything _just works_.

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

## Use jetpack with a server API

Point `package.json#main` at your server entry and configure `entry` in `jetpack.config.js` for your client. To run the API alongside jetpack in a single command:

    $ jetpack -x

or with a custom command:

    $ jetpack -x 'nodemon ./api'
    $ jetpack -x 'rails s'

Use the `proxy` config option or the `jetpack/serve` middleware to bridge your client and server in dev. See [Workflow and deployment](./docs/06-workflow-and-deployment.md).

## Documentation

- [All configuration options](./docs/01-configuration-options.md)
- [Customizing Rspack](./docs/02-customizing-rspack.md)
- [Customizing SWC](./docs/03-customizing-swc.md)
- [Customizing Browserslist](./docs/05-customizing-browserslist.md)
- [Workflow and deployment](./docs/06-workflow-and-deployment.md)
- [Differential serving](./docs/07-differential-serving.md)
- [Hot reloading](./docs/08-hot-reloading.md)
- [Comparison](./docs/09-comparison.md)
