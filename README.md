<p align="center">
  <img src="https://user-images.githubusercontent.com/324440/48484676-a1690280-e80e-11e8-9835-14c6b0c5bb98.png" alt="jetpack" title="jetpack">
</p>

<h4 align="center">A more convenient webpack dev server.</h4>
<br />

**Jetpack wraps webpack** to create a smoother developer experience. Jetpack can be used instead of webpack, webpack-cli, webpack-dev-server and webpack-dev-middleware without writing any configuration. Jetpack is a thin wrapper around webpack, and can be extended with any of the webpack options.

- **Sensible defaults** to handle modern JavaScript, CSS and images.
- **Preconfigured Babel** with `@babel/preset-env` and `@babel/preset-react`, configurable via `.babelrc`.
- **Preconfigured PostCSS** with `postcss-preset-env` including autoprefixing, configurable via `postcss.config.js`.
- **Use CSS modules** by toggling a single config option on.
- **Automatic JSX detection** switches between `React.createElement` or `h` depending on dependencies.
- **Hot reloading built in** for React and for vanilla JavaScript and CSS.
- **Automatic chunk splitting** with inlined runtime and HTML generation.
- **Single dependency** with hassle-free updates.

**Why use jetpack?** To avoid rolling your own custom webpack config or having to paste it from previous project. Jetpack has a set of defaults that should get you off the ground quickly. And with the universal `jetpack/handle` middleware you don't have to worry about wiring up webpack dev middleware or dev server – everything _just works_.

## Usage

Install globally or locally:

    $ npm install -g jetpack

In your project with `package.json` or `index.js`, start your app on `http://localhost:3030`:

    $ jetpack

To build the app for production to a `dist` directory:

    $ jetpack build

Inspect the bundle size and make up:

    $ jetpack inspect

## Use jetpack anywhere, anytime

One of jetpack goals is to help you run any piece of JavaScript in a browser as easily as it it to run node scripts. Install jetpack globally and point it to any file on your machine. This is an alternative to jsfiddle / codepen / codesandbox style of trying things out.

    $ jetpack ~/Desktop/magic.js

Or any project on your machine:

    $ jetpack --dir ~/projects/manyverse

## Use jetpack with an API

Another goal of jetpack is to help you build real, useful, production apps end to end. Very often in addition to developing the clientside application, you are also developing some sort of an API. Jetpack has a few features to make building such apps easier.

First, you can run your API server in addition to jetpack dev server using a single command:

    $ jetpack -x                  // defaults to executing `node .`
    $ jetpack -x 'nodemon ./api'  // provide any command to execute
    $ jetpack -x 'rails s'        // doesn't even have to be done

Jetpack also provides an ability to proxy requests to your api or mount the development server to your application server using the `jetpack/handle` middleware.

## CLI Documentation

```
$ jetpack --help

Usage: jetpack [options] [command] [path]

Options:
  -V, --version       Output the version number
  -p, --port <n>      Port, defaults to 3030
  -d, --dir [path]    Run jetpack in the context of this directory
  -x, --exec [path]   Execute an additional process, e.g. an api server
  -j, --jsx <pragma>  Specify jsx pragma, defaults to React.createElement or Preact.h if preact is installed
  -h, --no-hot        Disable hot reloading
  -c, --config        Config file to use, defaults to jetpack.config.js
  -q, --quiet         Log no output
  -v, --verbose       Log verbose output
  -h, --help          Output usage information

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
