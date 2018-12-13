# Hot reloading

Hot reloading is turned on by default in jetpack. You can turn it off by passing `-h` arg or setting `hot: false` in the `jetpack.config.js` file.

## CSS

CSS is hot reloaded automatically with no extra steps.

## React

So are React components if you wrap your root component in the `Hot` component:

```js
import React from 'react'
import { hot } from 'jetpack/react-hot-loader/root'

const App = () => <div>Hello World!</div>

export default hot(App)
```

## Other JS

However, you can also hot reloading for any vanilla JavaScript even if you're not using React. That's something that webpack has always supported. All you need to do is add the following bit of code somewhere in your application, preferably in the entry module.

```js
if (module.hot) {
  module.hot.accept()
  module.hot.dispose(() => {
    // perform cleanup
  })
}
```

Now instead of simply reloading the page, webpack will reexecute the changed code. If you built your application in a way where it can be unrendered in dispose() and rendered again, you'll get a nice and quick hot reload behaviour. Note, you'll want to store the state on window or in localStorage if you want the app to remain in the same state after rerendering.

If `module.hot.accept` is not called by your code, the browser page will get refreshed.
