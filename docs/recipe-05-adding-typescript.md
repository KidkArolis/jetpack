# Adding Typescript

[TypeScript](https://www.typescriptlang.org/) is a typed superset of JavaScript that compiles to plain JavaScript.

To add Typescript to a jetpack project, follow these steps:

1. Run `npm install --save-dev typescript ts-loader`.
2. Create `jetpack.config.js` with the following contents

```js
module.exports = {
  webpack (config) {
    config.resolve.extensions = ['.tsx', '.ts', '.js', '.json']
    config.module.rules.oneOf[0].push({
      test: /\.tsx?$/,
      loader: 'ts-loader',
      exclude: /node_modules/,
    }
  }
}
```

Note: let me know if you know of a better way of integrating TypeScript and I might include it in jetpack by default.
