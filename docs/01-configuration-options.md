## Configuration

You can change config by using `jetpack.config.js` or command line arguments:

```js
module.exports = {
  port: 3000,
  jsx: "React.createElement" | "h", // if react is installed, h otherwise
  client: "./app/client", // the directory with the client code
  static: "./static", // if you want to serve assets like images
  dist: "dist", // the dir for building production client side code

  title: "pkg name", title of the html page
  html: "custom ejs template string", // if you want to change the default html served
  head: "", // string of html to add to head, e.g. analytics script
  body: `<div id="root"></div>`, // string of html to add to top of the body

  hot: true // toggle hot reloading,
  quiet: false, // no jetpack logs, only errors and logs from the app
  verbose: false, // more detailed logs,

  proxy: {}, // e.g. { '/api/*': 'http://localhost:3000' }

  // specify browser list using https://github.com/browserslist/browserslist syntax
  browsers: [
    '>1%',
    'last 4 versions',
    'Firefox ESR',
    'not ie < 9'
  ],

  css: {
    modules: false, // set true to use css modules
    features: {
      // specify postcss-css-env rules to add,
      // in addition to all of the stage 2 features
      // e.g. "nesting-rules": true
    }
  }
}
```
