## Flexible Deployment

When it's time to deploy your application to production, jetpack doesn't leave you stranded. Several common strategies are available for how to deploy your full application:

- For purely static client side only applications, deploy the `dist` folder to something like Netlify
- For quick prototypes or internal tools that use api, use `jetpack/handle` middleware and serve everything from a single server
- For best practise production setup, deploy your client side application to something like Netlify and your API to a server – in development, use the `proxy` configuration or connect by calling a separate server.