# Workflow and Deployment



When it's time to deploy your application to production, jetpack doesn't leave you stranded. Several common strategies are available for how to deploy your full application:

- For purely static client side only applications, deploy the `dist` folder to something like Netlify
- For quick prototypes or internal tools that use api, use `jetpack/handle` middleware and serve everything from a single server
- For best practise production setup, deploy your client side application to something like Netlify and your API to a server – in development, use the `proxy` configuration or connect by calling a separate server.

# Deplying to Netlify

### Aproach 1 – client and server separate – JAMStack approach

Jetpack is just for your client app. Serves all the things.

jetpack dev server running on 3030
  in dev -> connect to api at localhost:3000 with CORS
  in prd -> connect to api at api.service.com with CORS

### Aproach – your server serves clientside assets via jetpack-handle

When you're building a node server as your main entry point and want to handle assets too.
Separate, optional package for serving up jetpack assets in dev and and prod.

  in dev -> proxies to 3030
  in prd -> serves build assets

### Development experience

In both cases, in development you need to run jetpack and your api server. You can run them in 2 separate terminals, which is good for clear separation of the log output and independent watching with nodemon.

Alternatively, if you want to run both at the same time, use something like `nf` with Procfile.

Alternatively, jetpack has a flag to run `npm start` or command configured in `jetpack.config.js` under `server`, which runs both jetpack and server. 

jetpack --server
