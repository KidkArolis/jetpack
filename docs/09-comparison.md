# Comparison

There are plenty of tools in this space — Vite, Parcel, esbuild, Next.js, etc. — and they each make different trade-offs.

Where jetpack tries to be different:

- Make it possible to run globally anywhere on your machine, much like `node ~/Desktop/test.js`.
- Good workflow for [developing client + server together](./06-workflow-and-deployment.md).
- Sensible production defaults out of the box, with no configuration.
- Optimised for SPAs (not SSR or SSG).

If you need server-side rendering, reach for Next.js. If you're building a primarily static content site, Astro will probably suit you better. For a quick interactive SPA with a custom server, jetpack is a good fit.

## Bonus

Because jetpack avoids anything too fancy, lots of apps work out of the box. For example:

    $ npx create-react-app my-app
    $ cd my-app
    $ jetpack
