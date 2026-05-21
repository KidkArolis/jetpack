import test from 'ava'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defineConfig, { resolveConfig } from 'jetpack'
import { html, renderHtmlResponse } from 'jetpack/html'
import rspack from 'jetpack/rspack'
import createRspackConfig from 'jetpack/rspack-config'
import { serve, serveResolved } from 'jetpack/serve'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

test('public modules expose the library API', (t) => {
  const config = { entry: './client.js' }

  t.is(defineConfig(config), config)
  t.is(typeof resolveConfig, 'function')
  t.is(typeof html, 'function')
  t.is(typeof renderHtmlResponse, 'function')
  t.is(typeof rspack, 'function')
  t.is(typeof createRspackConfig, 'function')
  t.is(typeof serve, 'function')
  t.is(typeof serve.resolve, 'function')
  t.is(typeof serveResolved, 'function')
})

test('rspack-config resolves config input explicitly', async (t) => {
  const configs = await createRspackConfig({ command: 'build', dir: path.join(fixturesDir, 'pkg-basic') })

  t.truthy(configs.modern)
  t.falsy(configs.legacy)
  t.is(configs.modern.mode, 'production')
})

test('rspack-config always resolves input instead of guessing by shape', async (t) => {
  const configs = await createRspackConfig({
    command: 'build',
    dir: path.join(fixturesDir, 'pkg-basic'),
    mode: 'production',
    logLevels: {}
  })

  t.truthy(configs.modern)
  t.is(configs.modern.mode, 'production')
})

test('rspack-config can generate a specific target set', async (t) => {
  const configs = await createRspackConfig(
    { command: 'build', dir: path.join(fixturesDir, 'pkg-basic') },
    { target: 'all' }
  )

  t.truthy(configs.modern)
  t.truthy(configs.legacy)
})

test('removed public entry points are not exported', async (t) => {
  await t.throwsAsync(import('jetpack/options'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' })
  await t.throwsAsync(import('jetpack/proxy'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' })
  await t.throwsAsync(import('jetpack/rspack.config'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' })
})
