# Hot reloading

Hot reloading is turned on by default in jetpack. You can turn it off by passing `-r` arg or setting `hot: false` in the `jetpack.config.js` file.

## CSS

CSS is hot reloaded automatically with no extra steps.

## React

React components will get hot reloaded if you install `react-hot-loader` (`react` and `react-dom` also must be installed) and mark your root component as `hot`:

```js
import React from 'react'
import { hot } from 'react-hot-loader/root'

const App = () => <div>Hello World!</div>

export default hot(App)
```

## Vanilla JS

If you're not using React, hot reloading can still be used. That's something that webpack supports natively. All you need to do is add the following bit of code somewhere in your application, preferably in the entry module.

```js
if (module.hot) {
  module.hot.accept()
  module.hot.dispose(() => {
    // perform cleanup
  })
}
```

Now webpack will re execute the changed code. If you built your application in a way where it can be unrendered in dispose() and rendered again, you'll get a nice hot reloading behaviour. Note, you'll want to store the state on window or in localStorage if you want the app to remain in the same state after rerendering.

If `module.hot.accept` is not called by your code, you'll only get hot reloading behaviour for your css and will have to manually refresh the page for any other changes.

## Gotchas

It's common to get the following error in the network panel:

```
GET http://localhost:3030/assets/__webpack_hmr net::ERR_INCOMPLETE_CHUNKED_ENCODING 200 (OK)
```

This could happen if you keep your client and server code in the same project and use `nodemon` to restart server on code changes. Nodemon restarts the server and the hot reload gets interrupted. Make sure to ignore changes to client code in this case, e.g. `nodemon -i app/client .`.