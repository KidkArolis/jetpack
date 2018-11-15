# Workflow and Deployment

Very often when you are developing a client side web application, you are also building an accompanying API. Jetpack was created to specifically help in that scenario.

Sometimes an application is just a quick and simple tool, say an internal tool for your company. In which case you don't need fancy deployment, you just need to get things done quickly.

And sometimes, you want the app to be fast to users around the world.

In this article we look at several approaches you can take when developing and deploying your apps.

## Purely client side apps

If you are building a purely static app. Things are simple:

1. Develop your app using `jetpack` dev server
2. When it's ready to be deployed, build with `jetpack build`
3. Deploy to your favorite static host, e.g. `netlifyctl deploy -b dist`

## Client and API in one

For simple tools, e.g. internal business tools, it's very convenient to keep the code and deployment all in one place.

In your `package.json`, make sure `"main"` points to your server entry point. This way it's easy to run your server by executing `node .` or `nodemon `.

In your `jetpack.config.js` configure `entry` to point to your client side entry point. This way it's easy to run your jetpack dev server by executing `jetpack`.

Because we'd like to keep the deployment of this as simple as possible, we will be serving our client side assets via our API server. To do that, you can make use of the `jetpack/serve` middleware. For example:

```js
const express = require('express')
const jetpack = require('jetpack/serve')

const app = express();

app.get('/api/unicorns', (req, res) => {...})
app.get('*', jetpack)
```

Note: here we're using express, but it's possible to plug `jetpack/serve` into any framework that has node's `req` and `res` available.

Now we're ready to develop this application. To run both your client dev server and the API server at once, you can execute:

    $ jetpack --exec

or

    $ jetpack -x

But often, it's most convenient to use a split terminal and in one run:

    $ jetpack

And in the other run:

    $ nodemon .

This way we get both client and server to restart on every code change.

What does `jetpack/serve` do? In development it proxies to the jetpack dev server. In production, it efficiently serves your built assets from the `dist` directory.

To deploy this project to a server you would just run `jetpack build` and use the entry point of `node .` to run your application. In Docker, for example, it would look like this:

```
FROM node:10

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

CMD [ "node", "." ]
```

# Deploying Client and Server separately

If you're not using node.js for your server, or if you're working on an application where performance is important, it's best to deploy your client side assets to a CDN, separetly from your API server.

When making requests from your web app into your API, you might choose to request the full host, e.g.:

- `fetch('http://localhost:3000/unicorns')` in development
- `fetch('https://api.myapp.com/unicorns')` in production

This way you might need to configure CORS headers.

Or you might request your API relative, e.g.:

- `fetch('/api/unicorns')` in both development and production

If you're doing the latter, then you could employ jetpack's proxy feature, in your `jetpack.config.js`:

```js
module.exports = {
  proxy: {
    '/api/*': 'http://localhost:3000'
  }
}
```

To deploy this, you would now deploy your assets to a CDN and your API to an application server separately.

For example, when using [Netlify](https://www.netlify.com/) and [Dokku](http://dokku.viewdocs.io/dokku/):

    # release the client side app
    $ jetpack build
    $ cp _redirects dist
    $ netlifyctl deploy -b dist

    # release the server side api
    $ git push dokku master

Note: we're using Netlify's [_redirects](https://www.netlify.com/docs/redirects/) feature in this case to proxy the requests to your API server deployed via Dokku.

Alternatively, some platforms, such as [Now](https://zeit.co/now) support both static assets and APIs, in that case, you could deploy this app using a `now.json` config like this:

```
{
  "version": 2,
  "builds": [
    { "src": "server/index.js", "use": "@now/node-server" },
    { "src": "package.json", "use": "@now/static-build" }
  ],
  "routes": [
    { "src": "/api/*", "dest": "/server/index.js" }
  ]
}
```

## Conclusion

I hope this shed a little bit of light on why jetpack was created. It tries to fit into all of these different development workflows, whilst staying very light on configuration. If you find this article interesting, but got confused and would like me to expand, post an issue and let me know!
