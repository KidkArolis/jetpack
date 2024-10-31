<p align="center">
  <img src="https://user-images.githubusercontent.com/324440/48484676-a1690280-e80e-11e8-9835-14c6b0c5bb98.png" alt="jetpack" title="jetpack">
</p>

<h4 align="center">Rspack made more convenient.</h4>
<br />

**Jetpack wraps rspack** to create a smoother developer experience. Jetpack can be used instead of @rspack/core, @rspack/cli, webpack-dev-server and webpack-dev-middleware without writing any configuration. Jetpack is a thin wrapper around rspack, and can be extended with any rspack configuration.

- **Sensible defaults** to handle modern JavaScript, CSS and images.
- **Preconfigured swc-loader** for speedy compilation.
- **Preconfigured core-js** for polyfilling missing browser features.
- **Preconfigured postcss-loader** with `postcss-preset-env` including autoprefixing.
- **Modern bundles by default** with no async/await transpilation.
- **Differential builds** with modern/legacy bundles served based on user agent headers.
- **CSS modules** one config flag away.
- **Sass** auto enabled by installing `node-sass`.
- **JSX detection** with `React.createElement` or `h` depending on dependencies.
- **Hot reloading** using `fast-refresh` for React as well as for vanilla JavaScript and CSS.
- **Automatic chunk splitting** with inlined runtime and HTML generation.
- **Single dependency** with hassle-free updates.

**Why use jetpack?** To avoid rolling your own custom rspack config or having to paste it from old projects. Jetpack has a set of defaults that should get you off the ground quickly. And with the `proxy` config or the universal `jetpack/serve` middleware you don't have to worry about wiring up webpack dev middleware or dev server – everything _just works_.

## Usage

Install globally or locally:

    $ npm install -g jetpack

In your project with `package.json` or `index.js`, start your app on `http://localhost:3030`:

    $ jetpack

To build the app for production to a `dist` directory:

    $ jetpack build

Inspect the bundle size and make up:

    $ jetpack inspect

Print what browsers will be supported:

    $ jetpack browsers
    $ jetpack browsers --coverage=GB

## Use jetpack anywhere, anytime

One of jetpack goals is to help you run any piece of JavaScript in a browser as easily as it is to run node scripts. Install jetpack globally and point it to any file on your machine. This is an alternative to jsfiddle / codepen / codesandbox style of hacking on things.

    $ jetpack ~/Desktop/magic.js

Or any project on your machine:

    $ jetpack --dir ~/projects/manyverse

## Use jetpack with a server API

Another goal of jetpack is to assist you in building complete, production apps. Very often in addition to developing the clientside application, you are also developing an API. Jetpack has a few features to make building such apps easier.

Point your `package.json#main` to your server entry and `package.json#browser` to your client entry.

Now you can run your API server together with jetpack in a single command:

    $ jetpack -x

Alternatively, specify any command to execute:
$ jetpack -x 'nodemon ./api'

Use this even if your server is not written in node

    $ jetpack -x 'rails s'

Jetpack provides an ability to proxy requests to your api by specifying `proxy` configuration in `jetpack.config.js` or mounting the dev server to your application server using the `jetpack/serve` middleware. Read more about it in [Workflow and deployment](./docs/06-workflow-and-deployment.md) docs.

## Documentation

- [All configuration options](./docs/01-configuration-options.md)
- [Customizing Rspack](./docs/02-customizing-rspack.md)
- [Customizing SWC](./docs/03-customizing-swc.md)
- [Customizing PostCSS](./docs/04-customizing-postcss.md)
- [Customizing Browserslist](./docs/05-customizing-browserslist.md)
- [Workflow and deployment](./docs/06-workflow-and-deployment.md)
- [Differential serving](./docs/07-differential-serving.md)
- [Hot reloading](./docs/08-hot-reloading.md)
- [Comparison to cra, pwa-cli, parcel, etc.](./docs/09-comparison.md)

#### Recipes

- [Adding Flow](./docs/recipe-04-adding-flow.md)
- [Adding Typescript](./docs/recipe-05-adding-typescript.md)
- [Server side rendering](./docs/recipe-06-server-side-rendering.md)

## Motivation

This project is an exploration of some ideas accumulated over a few years using webpack in a variety of projects. Webpack is a very powerful and flexible tool. It applies to a lot of use cases and that is one of the reasons it has so many configuration options. Webpack also evolved over the years but preserved backward compatibility as much as possible to support the large ecosystem built around it.

Rspack is a webpack compatible Rust rewrite that offers a significant performance boost over webpack.

Jetpack is an exploration of how using webpack/rspack could be made easier if the defaults, the CLI usage patterns and the configuration came with good defaults.
