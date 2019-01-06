# Customizing browserlist

Jetpack compiles your code using `babel-preset-env` and `postcss-preset-env` plugins to ensure the code is ready for all the browsers you support. Those projects follow the lovely [browserlist](https://github.com/browserslist/browserslist) convention.

By default, jetpack uses the defaults that [browserlist](https://github.com/browserslist/browserslist) recommends.

To configure the list of browsers, you can use any of method supported by browserlist:

#### package.json

```js
{
  "private": true,
  "dependencies": {
    "autoprefixer": "^6.5.4"
  },
  "browserslist": [
    "last 1 version",
    "> 1%",
    "IE 10"
  ]
}
```

#### .browserlist config file

```
# Browsers that we support

last 1 version
> 1%
IE 10 # sorry
```

See [browserslist docs](https://github.com/browserslist/browserslist) for full details.
