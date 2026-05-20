import test from 'ava'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import options from '../lib/options.js'
import createRspackConfig from '../lib/rspack.config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

async function assetRules(assets) {
  const opts = await options({
    command: 'build',
    dir: path.join(fixturesDir, 'pkg-basic'),
    config: null
  })
  const config = createRspackConfig({
    ...opts,
    assets: {
      ...opts.assets,
      ...assets
    }
  }).modern

  return config.module.rules[0].oneOf.filter((rule) => rule.type?.startsWith('asset'))
}

test('image assets inline up to the configured limit', async (t) => {
  const rules = await assetRules({ inlineLimit: 4096 })
  const imageRule = rules.find((rule) => rule.test.test('icon.svg'))

  t.is(imageRule.type, 'asset')
  t.is(imageRule.parser.dataUrlCondition.maxSize, 4096)
})

test('font and media assets are emitted as files', async (t) => {
  const rules = await assetRules()
  const fontRule = rules.find((rule) => rule.test.test('font.woff2'))
  const mediaRule = rules.find((rule) => rule.test.test('movie.mp4'))

  t.is(fontRule.type, 'asset/resource')
  t.is(mediaRule.type, 'asset/resource')
})
