module.exports = config => {
  /**
   * Webpack outputs the © symbol differently on a Mac and on Travis CI
   * which means the ava snapshots don't match up. This replaces the copyright
   * symbol with something else in tests, so that the builds are identical in
   * all environments.
   */
  config.module.rules.unshift({
    test: /core-js\/internals\/shared\.js$/,
    loader: 'string-replace-loader',
    options: {
      search: '© 2019 Denis Pushkarev (zloirock.ru)',
      replace: '-'
    }
  })
}
