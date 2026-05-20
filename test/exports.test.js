import test from 'ava'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defineConfig, { resolveConfig } from 'jetpack'
import { html, renderHtmlResponse } from 'jetpack/html'
import rspack from 'jetpack/rspack'
import createRspackConfig from 'jetpack/rspack-config'
import { serve } from 'jetpack/serve'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

test('package root exposes the library API', (t) => {
  const config = { entry: './client.js' }

  t.is(defineConfig(config), config)
  t.is(typeof resolveConfig, 'function')
})

test('explicit public entry points expose specialist APIs', (t) => {
  t.is(typeof html, 'function')
  t.is(typeof renderHtmlResponse, 'function')
  t.is(typeof rspack, 'function')
  t.is(typeof createRspackConfig, 'function')
  t.is(typeof serve, 'function')
})

test('rspack-config resolves config input explicitly', async (t) => {
  const configs = await createRspackConfig({ command: 'build', dir: path.join(fixturesDir, 'pkg-basic') })

  t.truthy(configs.modern)
  t.truthy(configs.legacy)
  t.is(configs.modern.mode, 'production')
})

test('removed public entry points are not exported', async (t) => {
  await t.throwsAsync(import('jetpack/options'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' })
  await t.throwsAsync(import('jetpack/proxy'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' })
  await t.throwsAsync(import('jetpack/rspack.config'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' })
})
