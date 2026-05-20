import test from 'ava'
import defineConfig, { html, renderHtmlResponse, resolveOptions, rspackConfig } from 'jetpack'
import explicitRspackConfig from 'jetpack/rspack.config'

test('package root exposes the library API', (t) => {
  const config = { entry: './client.js' }

  t.is(defineConfig(config), config)
  t.is(typeof resolveOptions, 'function')
  t.is(typeof html, 'function')
  t.is(typeof renderHtmlResponse, 'function')
  t.is(rspackConfig, explicitRspackConfig)
})
