# Adding Typescript

[TypeScript](https://www.typescriptlang.org/) is a typed superset of JavaScript that compiles to plain JavaScript.

To add Typescript to a jetpack project, follow these steps:

1. Run `npm install --save-dev typescript ts-loader`.
2. Create `jetpack.config.js` with the following contents:

```js
module.exports = {
  webpack (config) {
    config.resolve.extensions = ['.tsx', '.ts', '.js', '.json']
    config.module.rules[0].oneOf.push({
      test: /\.tsx?$/,
      loader: 'ts-loader',
      exclude: /node_modules/,
    })
  }
}
```

3. Create `tsconfig.json` with something like:

```js
{
  "compilerOptions": {
    "target": "es5",
    "allowJs": true,
    "skipLibCheck": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react"
  },
  "include": [
    "src"
  ]
}
```

Note: let me know if you know of a better way of integrating TypeScript and I might include it in jetpack by default.
