# serve-with-express

This shows how to use the `jetpack/serve` middleware in development and production when using express.

    $ npm install

In development, run the client dev server and the Express server in separate terminals:

    $ npm run dev:client
    $ npm start

In production, build the client and start the server with `NODE_ENV=production`:

    $ npm run build
    $ NODE_ENV=production npm start
