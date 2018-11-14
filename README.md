<p align="center">
  <img src="https://user-images.githubusercontent.com/324440/48484676-a1690280-e80e-11e8-9835-14c6b0c5bb98.png" alt="jetpack" title="jetpack">
</p>

<h4 align="center">A more convenient webpack dev server.</h4>
<br />

**Jetpack wraps webpack** to create a smoother developer experience. Jetpack can be used instead of webpack, webpack-cli, webpack-dev-server and webpack-dev-middleware without writing any configuration. Jetpack is a thin wrapper around webpack, and can be extended with any of the webpack options.

- **Sensible webpack defaults** to handle bundling modern JavaScript, CSS and images.
- **Preconfigured babel** with `@babel/preset-env` and `@babel/preset-react`, configurable via `.babelrc`.
- **Automatic JSX detection** toggling between `React.createElement` or `h` depending on whether `preact` is installed.
- **Modern CSS** with `postcss-preset-env` and autoprefixing, configurable via `postcss.config.js`.
- **Opt into CSS modules** by toggling one config option on.
- **Hot reloading built in** for React and for vanilla JavaScript and CSS.
- **Automatic chunk splitting** with inlined runtime and HTML generation.
- **Single dependency** with hassle-free updates.

**Why use jetpack?** To avoid rolling your own custom webpack config or having to paste it from previous project. Jetpack has a good set of defaults that should get you off the ground quickly. And with the universal `jetpack/handle` middleware you don't have to worry about wiring up webpack dev middleware or dev server – everything _just works_.

## Usage

Install globally or locally:

    $ npm install -g jetpack

In your project with `package.json` or `index.js`, start your app on `http://localhost:3030`:

    $ jetpack

Alternatively, point `jetpack` to any js file on your machine:

    $ jetpack ~/Desktop/magic.js

Or any project on your machine:

    $ jetpack --dir ~/projects/manyverse

To build the app for production to a `dist` directory:

    $ jetpack build

Run your API server in addition to jetpack dev server:

    $ jetpack -x 'node ./api'

Inspect the bundle size and make up:

    $ jetpack inspect

If you want to switch away from using jetpack and jump into raw webpack (*coming soon*):

    $ jetpack unstrap

## CLI Documentation

```
$ jetpack --help

Usage: jetpack [options] [command] [path]

Options:
  -V, --version       output the version number
  -p, --port <n>      Port, defaults to 3030
  -d, --dir [path]    Run jetpack in the context of this directory
  -x, --exec [path]   Execute an additional process, e.g. an api server
  -j, --jsx <pragma>  Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed
  -h, --no-hot        Disable hot reloading
  -c, --config        Config file to use, defaults to jetpack.config.js
  -q, --quiet         Log no output
  -v, --verbose       Log verbose output
  -h, --help          output usage information

Commands:
  build               build for production
  inspect             analyze bundle
  clean               remove the dist dir
```

## Documentation

* [Configuration options](./docs/01-configuration-options.md)
* [Custom webpack config](./docs/01-custom-webpack-config.md)
* [Hot reloading](./docs/02-deploying-to-netlify.md)
* [Universal middleware jetpack/handle](./docs/02-deploying-to-netlify.md)
* [Development and deployment strategies](./docs/02-deploying-to-netlify.md)

#### Recipes

* [Deploying to Netlify](./docs/02-deploying-to-netlify.md) – static apps
* [Deploying to Now](./docs/02-deploying-to-netlify.md) – client and server all in one
* [Deploying to Netlify + Now](./docs/02-deploying-to-netlify.md) – client and server separated
* [Using with Flow](./docs/02-deploying-to-netlify.md)
* [Using with Typescript](./docs/02-deploying-to-netlify.md)
* [Server side rendering](./docs/02-deploying-to-netlify.md)
