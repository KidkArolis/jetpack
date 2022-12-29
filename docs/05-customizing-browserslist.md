# Customizing browserslist

Jetpack compiles your code using `swc-loader` and `postcss-preset-env` plugins to ensure the code is ready for all the browsers you support. Those projects follow the lovely [browserlist](https://github.com/browserslist/browserslist) convention.

Jetpack supports differential serving, that is it can produce 2 bundles - modern and legacy. By default jetpack only builds a modern bundle using the `defaults` [browserslist query](https://browsersl.ist/#q=defaults):

```
defaults
```

Which is shortcut for:

```
> 0.5%
last 2 versions
Firefox ESR
not dead
```

This query ensures that only modern browsers with full support for async/await are targeted. This removes the need to transpiled async/await and many other modern JavaScript features.

To configure the list of browsers, you can use any of methods supported by browserslist, but make sure to use `modern` and `legacy` environments:

#### package.json

```js
{
  "private": true,
  "dependencies": {
    "autoprefixer": "^6.5.4"
  },
  "browserslist": {
    "modern": [
      "last 1 version",
      "> 1%",
      "IE 10"
    ]
  }
}
```

#### .browserslistrc config file

```
# Browsers that we support
[modern]
last 1 version
> 1%
IE 10 # sorry

[legacy]
> 0.1%
```

See [browserslist docs](https://github.com/browserslist/browserslist) for more details.
