const neostandard = require('neostandard')

// Function to patch the neostandard config
function superneostandard(neoConfig) {
  const config = neostandard(neoConfig)

  // allow jsx in js files! that's all we're doing!
  const jsxIndex = config.findIndex((c) => c && c.name === 'neostandard/jsx')
  const jsxCfg = config[jsxIndex]
  config[jsxIndex] = {
    ...jsxCfg,
    name: 'neostandard/jsx',
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [], // remove ignore patterns that excluded .js
    languageOptions: {
      ...(jsxCfg.languageOptions || {}),
      parserOptions: {
        ...((jsxCfg.languageOptions && jsxCfg.languageOptions.parserOptions) || {}),
        ecmaFeatures: { jsx: true }
      }
    }
  }

  return config
}

// Build + patch neostandard config
module.exports = superneostandard({
  noStyle: true,
  ignores: ['dist/**/*', ...neostandard.resolveIgnoresFromGitignore()]
})
