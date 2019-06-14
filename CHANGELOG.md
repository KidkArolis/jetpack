# 0.15.1

* Fix compiler error handling - catch build errors thoroughly and always exit with status 1 if compilation fails for any reason.

# 0.15

* Add support for Sass! Simply install `node-sass` or `sass` and import '.scss' files. Works with css modules, allows specifying `resources: []` that become available to each scss file.
* Fix an issue where jetpack/serve was running command line arg parsing, preventing ability to require apps that import jetpack/serve. This is useful when you try and require your app for debugging and tests.
* Upgrade to core-js@3
* Upgrade all dependencies

# 0.14.2

* Fix compiler error handling

# 0.14.1

* Fix compiler error handling

# 0.14.0

* Upgrade all deps
* Fix how `babel` and `@babel/preset-env` detects module types when deciding how to inject polyfills, by using `sourceType: 'unambiguous'`, we ensure that no matter if you use CJS or ESM in your modules, jetpack will bundle them correctly and inject core-js polyfills correctly (most of the time anyway..).

# 0.13.0

* Upgrade all deps
* Fix `react-hot-loader` webpack plugin config

# 0.12.2

* Fix reading `title` from config file

# 0.12.1

* Fix where `react-hot-loader` is loaded from, it should be loaded from the target dir

# 0.12.0

* Rename the `--no-hot` shorthand from `-h` to `-r`, to reclaim `-h` for help info
* Fix `jetpack.config.js#hot` option, it wasn't being read from options since cli arg was always defaulting to `false`
* No longer refresh the page if webpack hot patch is not accepted, for nicer user experience. It's still possible to configure page reloading with manual config override using `jetpack.config.js#webpack`.
* Improve hot reloading support. `react-hot-loader` has been removed from jetpack. User's of jetpack now need to install `react-hot-loader` to opt into using it. Webpack config has been updated to work with `react-hot-loader@4.6.0` which supports React Hooks out of the box and improves the overall experience.

To use this you first need to install `react-hot-loader` with `npm i -D react-hot-loader` and then update the code from:

```
import { hot } from 'jetpack/react-hot-loader'
const App = () => <div>Hello World!</div>
export default hot(module)(App)
```

to

```
import { hot } from 'react-hot-loader/root'
const App = () => <div>Hello World!</div>
export default hot(App)
```

# 0.11.0

* Upgrade css-loader to 2.0.0. This upgrades it's dependency on PostCSS to v7, which means there's only one version of PostCSS being used by jetpack, which means faster install times and better performance.

# 0.10.4

* Fix `jetpack/serve` production mode, serve index.html if requested pathname does not exist in dist

# 0.10.3

* Remove console.log from the jetpack/serve module

# 0.10.2

* Fix `jetpack inspect` command
* Fix `proxy` to properly handle node's req and res
* Fix compatibility

# 0.10.1

* Fix `react-hot-loader` to work even when jetpack not installed locally
* Fix `proxy` to work with non express servers
* Only configure `react-hot-loader` if hot reloading is enabled and react is installed

# 0.10.0

Everything changed. Apologies if it broke your project. See the README and docs to learn about all the new features, command line args and configuration options.
