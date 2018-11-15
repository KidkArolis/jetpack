## Comparison

There exist many tools that try and make working with webpack easier:

* **create-react-app** – a great and powerful tool. I personally tend not to use, because I find it slightly big and intimidating, the codebase and the dependency tree is large, it's overly React specific and brings in opinionated tools such as `jest` testing framework. But it's a very comprehensive tool with great documentation, so keep using it if it works for you!
* **pwa-cli** – very similar to what jetpack is trying to do. Has a neat plugin system for extending its functionality beyond what the core provides. Why jetpack and not pwa-cli? Not sure, you'll have to try both and see what you prefer.

There are also alternatives to webpack:

* **Parcel** is making 🌊. Let's see what version 2.0 brings to the table. It has very similar goals to that of jetpack's – most things should just work and be convenient without configuration.
* **Browserify** – probably still has a hard core fan base ;) with dev servers similar to jetpack, e.g. [budo](https://github.com/mattdesl/budo) and [bankai](https://github.com/choojs/bankai) to mention a couple.

There also exist higher level frameworks for certain use cases:

* **Next.js** - use this when you need server side rendering. Server side rendering can be tricky to wrap your head around and so when you just want an Single Page Application – jetpack might be a better choice.
* **Gatsby.js** - use this when you're building a web app that can be exported to a bunch of html files – it's a great fit for websites. For richer, interactive web applications, jetpack might just be a simpler choice.

#### Conclusion

In general, where jetpack tries to be different is:

- keep the [codebase small and simple](../lib), so that it's easy to understand how to extend the configuration
- make it possible to run globally anywhere on your machine, just like you can run `node ~/Desktop/test.js`
- have [good workflow](./06-workflow-and-deployment.md) for simultaneously developing the client and the server
- make sure that if no configuration is touched, the application is bundled in the best possible way for production
- serve the SPA use case well (as opposed to SSR or SSG)
