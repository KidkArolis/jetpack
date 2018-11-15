# Customizing Babel

Jetpack uses Babel by default, because:

- this way you get JSX support out of the box
- you can be sure that the code you write will run in all the browsers you support

Jetpack uses the following PostCSS plugins and presets:

- `@babel/plugin-syntax-dynamic-import`
- `@babel/preset-env`
- `@babel/preset-react`

See [/lib/webpack.js.js](../lib/webpack.js.js) for the exact configuration.

It's easy to extend Babel with extra plugins or plugins by using `.babelrc` file.
