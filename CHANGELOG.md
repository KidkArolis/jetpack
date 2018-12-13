# 0.10.5

* Upgrade to `react-hot-loader@4.6.0` which supports hooks out of the box. Note, while the old API still works, prefer the new one:

```
import { hot } from 'jetpack/react-hot-loader/root'
const App = () => <div>Hello World!</div>
export default hot(module)(App)
```

instead of

```
import { hot } from 'jetpack/react-hot-loader'
const App = () => <div>Hello World!</div>
export default hot(App)
```

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
