# Customizing browserslist

Jetpack compiles your code using `babel-preset-env` and `postcss-preset-env` plugins to ensure the code is ready for all the browsers you support. Those projects follow the lovely [browserlist](https://github.com/browserslist/browserslist) convention.

Jetpack supports differential serving, that is it can produce 2 bundles - modern and legacy. By default jetpack only builds a modern bundle using the following browserslist query:

```
> 0.5% and last 2 versions
Firefox ESR
not dead
not edge < 16
not firefox < 60
not chrome < 61
not safari < 12
not opera < 48
not ios_saf < 11.4
not and_chr < 71
not and_ff < 64
not ie <= 11
```

This query ensures that only modern browsers with full support for async/await are targeted. This removes the need to transpiled async/await and many other features.

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

#### .browserslist config file

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
