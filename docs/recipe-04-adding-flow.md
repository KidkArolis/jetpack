# Adding Flow

Flow is a static type checker that helps you write code with fewer bugs. Check out this [introduction to using static types in JavaScript](https://medium.com/@preethikasireddy/why-use-static-types-in-javascript-part-1-8382da1e0adb) if you are new to this concept.

To add Flow to a jetpack project, follow these steps:

1. Run `npm install --save-dev flow-bin @babel/preset-flow`.
2. Run `npx flow init` to create a [`.flowconfig` file].
3. Add `// @flow` to any files you want to type check (for example, to `src/App.js`).
4. Create `.babelrc` with the following contents

```
{
  "presets": [
    "@babel/preset-flow"
  ]
}
```

Now you can run `npx flow` to check the files for type errors or run `npx jetpack` to run your app as usual.

To learn more about Flow, check out [its documentation](https://flow.org/).
