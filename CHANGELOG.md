# 5.0.0

- Breaking change: jetpack is now ESM. The package sets `"type": "module"` and all entry points (`jetpack`, `jetpack/serve`, `jetpack/proxy`, `jetpack/options`, `jetpack/rspack`, `jetpack/rspack.config`) are ES modules — consume them with `import` or dynamic `import()`. CommonJS `require()` of jetpack is no longer supported.
- Breaking change: `jetpack.config.js` is now loaded via `import()`. If your project uses `"type": "module"` (or has no type field and inherits one), your config can use `export default { ... }`. CommonJS configs continue to work either by using `module.exports = { ... }` in a project without `"type": "module"`, or by renaming to `jetpack.config.cjs`. A `jetpack.config.mjs` variant is also supported.
- Breaking change: `jetpack/options` now exports a function instead of a resolved options object. Use `import getOptions from 'jetpack/options'; const options = await getOptions()`.
- Breaking change: `jetpack/rspack.config` now exports an async function that returns the rspack config. Pass it directly to rspack — `rspack --config node_modules/jetpack/rspack.config.js` continues to work since rspack supports async config functions.
- Breaking change: dropped the implicit `./src` entry fallback. Previously, when no entry was specified, jetpack would auto-detect `./src/index.js` even without it being declared anywhere. We now rely solely on standard Node module resolution — `package.json` `main` (or `exports`, `module`, `browser`) and `./index.js`. If your project has source under `./src/` and no `main` field, add `"main": "src/index.js"` to `package.json` (or set `entry: './src'` in `jetpack.config.js`).
- Replace `eslint` + `neostandard` + `prettier` with `oxlint` + `oxfmt`.
- Drop seven dependencies in favour of Node built-ins or short inline equivalents: `@swc/core` (unused), `regenerator-runtime` (no longer needed by modern SWC output), `parseurl` (use `URL`), `klaw` (use `fs.readdir` recursive), `prepend-transform` (inline `Transform` stream), `webpack-format-messages` (inlined), and `execa` (use `node:child_process.spawn`).
- Update to Rspack 2.0. Internal-only changes for jetpack: switched to `ReactRefreshRspackPlugin` (renamed from default export of `@rspack/plugin-react-refresh`), updated the `ProgressPlugin` handler signature (third arg is now an `info` object, no longer used), and started passing `{ entrypoints: true }` to `stats.toJson()` where needed. See the [Rspack v1 → v2 migration guide](https://rspack.rs/guide/migration/rspack_1.x) if you customise rspack via `jetpack.config.js`.
- Fix `--no-hot` and `--no-minify` flags — they were silently broken because Node's `parseArgs` strict mode rejected them before the fallback `process.argv.includes` checks could run. Now declared as proper boolean options.
- `jetpack inspect` no longer auto-opens the analyzer in your browser when stdout isn't a TTY (CI, tests, piped output). The URL is still printed.
- `output.publicPath` is now `'auto'` — the bundle computes its runtime URL from the loaded script's location. Works out of the box for CDN deployments and sub-path mounts. The `options.publicPath` (default `/assets/`) still controls the static HTML template's asset URLs.
- Fix asset module cache-busting: filenames now use `[contenthash:8]` (was `[hash:8]`, which is the build-wide compilation hash and changes whenever anything in the build changes).
- Expand the asset extensions list: added `avif`, `webp`, `bmp`, `ico`, `aac`, `flac`, `m4a`, `mp3`, `opus`, `wav`, `m4v`.
- Internal cleanup of the rspack config:
  - Drop the dead `devServer` block (jetpack uses `webpack-dev-middleware` directly via express; rspack's `devServer` settings were never read).
  - Drop redundant `optimization.usedExports: true` (already default in production).
  - Drop `splitChunks: { chunks: 'all' }` override — rspack 2's defaults are reasonable.
  - Drop the `performance.maxAssetSize: 500_000` override; users can set it via `rspack` config hook if they care.
  - Single conditional filename pattern instead of post-hoc `string.replace`.
  - Drop the empty `jsc.transform: {}` placeholder from swc-loader options; the React plugin now ensures the object exists when it needs to attach to it.
  - Collapse the hardcoded node_modules exclude list into a single named constant (`JETPACK_BUNDLED_DEPS`).

# 4.4.2

- Fix proxy error handling when headers have already been sent

# 4.4.1

- Fix Firefox HMR warning
- Fix error page render when assets are not published to npm

# 4.4.0

- Update to Rspack 1.7.4
- Nicer looking error page when jetpack is not running
- Allow silencing hmr logs in the browser

# 4.3.0

- Update to Rspack 1.6.4
- Update all dependencies

# 4.2.1

- Update to Rspack 1.5.2
- Update all dependencies

# 4.2.0

- Update to Rspack 1.5
- Update all dependencies to remove vulnerabilities
- Replace the use of `inquirer-confirm` dependency with a local implementation
- Remove the use of `fs-extra` and `require-relative` in favor of Node built in modules

# 4.1.0

- Make rspack config creation synchronous
- Use `jetpack/rspack.config.js` to import the full rspack config object as used by jetpack

# 4.0.0

- Add `typescript` support, compiled by `builtin:swc-loader`
- Use `core-js@3.40` to correctly include latest polyfills
- Switch to `builtin:swc-loader`
- Make it easier to import global css when using css modules - css in \*.global.css or node_modules no longer considered as css modules
- Remove `h` as the default jsx pragma, instead use swc-loader's automatic mode for react
- Upgrade to express@5

# 3.1.0

- Removed `commander` in favor of native Node.js `parseArgs` util, this might have slight affect on cli flags
- Upgrade all dependencies, including `rspack@1.1.2`
- Switch `core-js` to usage mode for smaller bundles as less and less `core-js` is needed for smaller browsers
- Improve portability of `jetpack` - running it without installing it locally should work better now

# 3.0.0

**Replacing webpack with rspack! 🎉**

- Breaking change: Replaces `webpack` with `rspack` - this adds a significant performance boost to jetpack. This is largely backwards compatible. However, if you customise your webpack in jetpack.config.js you might need to read the rspack [migration guides](https://rspack.dev/guide/migration/webpack).
- Breaking change: Replaces `postcss` with the faster `lightningcss` via rspack's builtin loaders. It serves the same purpose of lowering css syntax for older browsers.
- Upgrade `sass-loader` to use the modern `sass-embedded` which is significantly faster, this should be backwards compatible, but expect sass warnings if you're using older sass syntax.

# 2.1.0

- Adds `chunkLoadRetry` option for reloading chunks
- Upgrade all dependencies

# 2.0.0

- Breaking change: styles are exported as named exports, so you must now write `import * as style from "./style.css"`, see https://github.com/webpack-contrib/css-loader/releases/tag/v7.0.0 for further details
- Upgrade all dependencies

# 1.4.0

- Upgrade all dependencies
- Add support for `jetpack.config.cjs` in addition to `jetpack.config.js` - helps in ESM native Node.js projects

# 1.3.0

- Upgrade all dependencies
- Fix the `-x, -exec` command

# 1.2.1

- Fix: Correctly parse the `--config` command line arg.
- Patch dependencies via npm audit

# 1.2.0

- Upgrade all dependencies
- Remove preact example, since the example was out of date

# 1.1.0

- Upgrade all dependencies

# 1.0.0

- Jetpack has been used in prod for years now and deserves a 1.0.0 🥳

# 0.30.0

- Upgrade to webpack 5!
- Switch to swc-loader from babel for super fast build times!
- Log build progress (disable with `--no-progress` or `progress: false` in the config
- Improve error handling, log unexpected errors when serving bundles in development instead of hanging
- Remove the graceful termination fix introduced in 0.21.1 as it does not appear to work in node@16
- Replace url-loader and file-loader with webpack 5 native asset support
- Upgrade all dependencies
- **Breaking:** switch to the latest browserslist defaults - this makes both `modern` and `legacy` builds the same by default, but you can still configure each one independently
- **Breaking:** the runtime content is now referenced via `runtime` instead of `assets.runtime` in the template
- **Breaking:** simplified logging behind `--log` flag, choose between `info`, `progress` or `none`, with default being `info,progress`
- **Breaking:** removed support for react-hot-loader, you can still tweak your config to pull it in, but it is no longer automatically configured, use `react-refresh` instead!
- **Breaking:** remove --jsx command line flag, use config instead

# 0.22.0

- Add support for optional chaining and nullish coalescing operator. This is supported by babel out of the box, but since jetpack is still on webpack 4 (it's faster?), we need to include the right plugins explicitly for this to work.
- Upgrade all of the non breaking dependencies

# 0.21.1

- Fix graceful termination in `jetpack/serve`. In case the req is destroyed, make sure to also destroy the upstream proxyReq to the dev server, so that the request does not hold up the server from closing.

# 0.21.0

- Upgrade all dependencies. Except do not upgrade to webpack 5 just yet and do not upgrade plugins that dropped webpack 4 support.

# 0.20.1

- Fix proxy feature - proxy the query params correctly (issue #89)

# 0.20.0

- Upgrade all dependencies, this includes updating to `PostCSS 8` and includes a breaking change to the webpack config generated by jetpack around the `postcss-loader`

# 0.19.0

- Default to `fast-refresh` for React hot reloading if `react-hot-loader` is not installed in the project

# 0.18.1

- Install caniuse-lite as a project dependency, to force install the latest version globally in the dependency tree. Previously, a message "Browserslist: caniuse-lite is outdated. Please run next command `npm update`" would show up to jetpack's users.

# 0.18.0

- Upgrade all dependencies

# 0.17.2

- Allow removing `core-js` alias to allow for any version of `core-js`. See https://github.com/KidkArolis/jetpack/pull/69.

# 0.17.1

- Add `options.publicPath` - allows to specify where assets will be served from, e.g. a CDN url.

# 0.17

**Big improvements! 🎉**

- Add support for differential bundling - jetpack can output modern and legacy bundles
- Modern bundles are smaller and less transpiled compared to the previous version
- Ship a complementary package for differential serving - [jetpack-serve](https://github.com/KidkArolis/jetpack-serve)
- Transpile node_modules ensuring modern packages from npm work as expected
- Add content hashes to output file names to improve long term caching
- Add `-i, --print-config` option to dev and build commands
- Upgrade all dependencies

**Differential bundling**

- By default, jetpack only compiles for modern browsers.
- To see what browsers those are, jetpack provides a new command `jetpack browsers` that prints the browserslist query, list of browsers and coverage.
- To opt into legacy browser bundling you should configure a new option `options.target = { modern: true, legacy: true }`.
- Or pass `--legacy`, `--modern` or both to `serve`, `build`, `inspect` and `browsers`, e.g.:

```
$ jetpack --legacy
$ jetpack inspect --legacy
$ jetpack browsers --legacy
$ jetpack browsers --modern
$ jetpack browsers --legacy --modern
```

- Previously, jetpack would not always correctly transpile async/await. Now, jetpack ships with it's own copy of regenerator, but only uses it in legacy browsers by default. Modern browsers will get no async/await transpilation!
- You can customize what browsers are considered modern and legacy using any of the methods supported by browserslist. Use `modern` and `legacy` environments to configure the browsers for each. Here's an example of `.browserslistrc` file:

```
[modern]
> 10%

[legacy]
> 0.1%
```

- You can check that the configuration is taken into account by running `jetpack browsers` whenever you tweak your browserslist.

**Differential serving**

- For production serving, jetpack opted to not use module/no module approach by default due to it's 2 limitations:
  - First, at the moment, module/no module option in @babel/preset-env transpiles async/await into regenerator and that's not desired for modern browsers.
  - Second, over time, the browsers that support modules will get old, and by using browser detection to serve the right bundle we can keep transpiling less and less in the future.
- By default, if you only produce a modern bundle, the output is backward compatible and can be served the same way as in previous versions of jetpack, e.g. using `express.static` middleware or by uploading `dist` to a CDN. If you produce both modern and legacy bundles, however, you will have to use the built in `jetpack/serve` module or the new [jetpack-serve(https://github.com/KidkArolis/jetpack-serve) package. Jetpack's serve middleware now detects if the browser is modern or not using the same browserslist queries used in bundling and serves the appropriate html file the `index.html` or `index.legacy.html` as appropriate. See https://github.com/KidkArolis/jetpack-serve for more details on usage.

**Print config**

- You can now see the config that has been generated for your dev or production builds by running some of the following:

```
jetpack -i
jetpack --print-config
jetpack --print-config --legacy
jetpack build --print-config
jetpack build --print-config --modern
jetpack build --print-config --legacy
```

This prints the config using Node's `util.inspect`, and since webpack config is a JavaScript data structure that might contain functions, classes, instances and other non easily serializable things, not everyhting might be easily inspectable in this output. This is not meant to be used as copy paste into `webpack.config.js` (althought it could be a good starting point), it's mostly meant for debugging any issues and understanding exactly what jetpack is doing in your project.

# 0.16.1

- Run postcss over sass loader output, this fixes autoprefixing sass
- Upgrade all dependencies

# 0.16

- Fix compiler error handling - catch build errors thoroughly and always exit with status 1 if compilation fails for any reason.
- Fix all security warnings
- Upgrade all dependencies, brings in file-loader@4.0.0, url-loader@2.0.0, css-loader@3.0.0 that have some breaking changes

# 0.15

- Add support for Sass! Simply install `node-sass` or `sass` and import '.scss' files. Works with css modules, allows specifying `resources: []` that become available to each scss file.
- Fix an issue where jetpack/serve was running command line arg parsing, preventing ability to require apps that import jetpack/serve. This is useful when you try and require your app for debugging and tests.
- Upgrade to core-js@3
- Upgrade all dependencies

# 0.14.2

- Fix compiler error handling

# 0.14.1

- Fix compiler error handling

# 0.14.0

- Upgrade all deps
- Fix how `babel` and `@babel/preset-env` detects module types when deciding how to inject polyfills, by using `sourceType: 'unambiguous'`, we ensure that no matter if you use CJS or ESM in your modules, jetpack will bundle them correctly and inject core-js polyfills correctly (most of the time anyway..).

# 0.13.0

- Upgrade all deps
- Fix `react-hot-loader` webpack plugin config

# 0.12.2

- Fix reading `title` from config file

# 0.12.1

- Fix where `react-hot-loader` is loaded from, it should be loaded from the target dir

# 0.12.0

- Rename the `--no-hot` shorthand from `-h` to `-r`, to reclaim `-h` for help info
- Fix `jetpack.config.js#hot` option, it wasn't being read from options since cli arg was always defaulting to `false`
- No longer refresh the page if webpack hot patch is not accepted, for nicer user experience. It's still possible to configure page reloading with manual config override using `jetpack.config.js#webpack`.
- Improve hot reloading support. `react-hot-loader` has been removed from jetpack. User's of jetpack now need to install `react-hot-loader` to opt into using it. Webpack config has been updated to work with `react-hot-loader@4.6.0` which supports React Hooks out of the box and improves the overall experience.

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

- Upgrade css-loader to 2.0.0. This upgrades it's dependency on PostCSS to v7, which means there's only one version of PostCSS being used by jetpack, which means faster install times and better performance.

# 0.10.4

- Fix `jetpack/serve` production mode, serve index.html if requested pathname does not exist in dist

# 0.10.3

- Remove console.log from the jetpack/serve module

# 0.10.2

- Fix `jetpack inspect` command
- Fix `proxy` to properly handle node's req and res
- Fix compatibility

# 0.10.1

- Fix `react-hot-loader` to work even when jetpack not installed locally
- Fix `proxy` to work with non express servers
- Only configure `react-hot-loader` if hot reloading is enabled and react is installed

# 0.10.0

Everything changed. Apologies if it broke your project. See the README and docs to learn about all the new features, command line args and configuration options.
