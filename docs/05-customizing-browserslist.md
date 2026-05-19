# Customizing browserslist

Jetpack compiles JS via `builtin:swc-loader` and CSS via `builtin:lightningcss-loader`. Both follow the [browserslist](https://github.com/browserslist/browserslist) convention. The top-level rspack `target` is set from your browserslist config and inherited by both loaders.

By default jetpack builds a single _modern_ bundle using the `defaults` [browserslist query](https://browsersl.ist/#q=defaults):

```
> 0.5%
last 2 versions
Firefox ESR
not dead
```

If you turn on differential builds (`target: { modern: true, legacy: true }`), you'll want to define two browserslist environments named `modern` and `legacy`.

### `package.json`

```json
{
  "browserslist": {
    "modern": ["last 1 version", "> 1%"],
    "legacy": ["> 0.1%"]
  }
}
```

### `.browserslistrc`

```
[modern]
last 1 version
> 1%

[legacy]
> 0.1%
```

See the [browserslist docs](https://github.com/browserslist/browserslist) for the full query syntax.
