import test from 'ava'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import options from '../lib/options.js'
import createRspackConfig from '../lib/rspack.config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

async function cssRules(modules) {
  const opts = await options({
    command: 'build',
    dir: path.join(fixturesDir, 'pkg-basic'),
    configFile: false
  })
  const config = createRspackConfig({
    ...opts,
    css: {
      ...opts.css,
      modules
    }
  }).modern

  return config.module.rules[0].oneOf.filter((rule) => rule.test.test('file.css') || rule.test.test('file.module.css'))
}

function cssLoader(rule) {
  return rule.use.find((loader) => loader.loader.includes('/css-loader'))
}

function cssExtractPlugin(config) {
  return config.plugins.find((plugin) => plugin.constructor.name === 'CssExtractRspackPlugin')
}

async function stylesheetRule(filename, sourceMaps) {
  const opts = await options({
    command: 'build',
    dir: path.join(fixturesDir, 'pkg-basic'),
    configFile: false
  })
  const config = createRspackConfig({
    ...opts,
    build: {
      ...opts.build,
      sourceMaps
    }
  }).modern

  return config.module.rules[0].oneOf.find((rule) => rule.test.test(filename))
}

test('css.modules false keeps all css global', async (t) => {
  const rules = await cssRules(false)

  t.is(rules.length, 1)
  t.falsy(cssLoader(rules[0]).options.modules)
})

test('css.modules true makes app css modular with global opt-out', async (t) => {
  const rules = await cssRules(true)

  t.is(rules.length, 2)
  t.regex(String(rules[0].test), /css/)
  t.regex(String(rules[0].exclude[0]), /global/)
  t.truthy(cssLoader(rules[0]).options.modules)
  t.falsy(cssLoader(rules[1]).options.modules)
})

test('css.modules object customizes module loader options', async (t) => {
  const rules = await cssRules({
    localIdentName: '[local]__[hash:base64:4]',
    namedExport: true
  })

  t.deepEqual(cssLoader(rules[0]).options.modules, {
    localIdentName: '[local]__[hash:base64:4]',
    namedExport: true
  })
})

test('css.modules conventional only enables modules for module files', async (t) => {
  const rules = await cssRules({
    conventional: true,
    namedExport: true
  })

  t.is(rules.length, 2)
  t.regex(String(rules[0].test), /module/)
  t.notRegex(String(rules[0].exclude[0]), /global/)
  t.deepEqual(cssLoader(rules[0]).options.modules, {
    localIdentName: '[name]--[local]___[hash:base64:5]',
    namedExport: true
  })
  t.falsy(cssLoader(rules[1]).options.modules)
})

test('css.modules rejects unsupported values', async (t) => {
  const src = path.join(fixturesDir, 'pkg-basic')
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-css-modules-'))
  await fs.cp(src, dir, { recursive: true, filter: (s) => !s.includes(`${path.sep}dist`) })
  t.teardown(() => fs.rm(dir, { recursive: true, force: true }))
  await fs.writeFile(path.join(dir, 'jetpack.config.mjs'), 'export default { css: { modules: "auto" } }\n')

  await t.throwsAsync(
    options({
      command: 'build',
      dir
    }),
    { message: 'css.modules must be false, true, or an object.' }
  )
})

test('css.modules rejects non-boolean conventional', async (t) => {
  const src = path.join(fixturesDir, 'pkg-basic')
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-css-modules-'))
  await fs.cp(src, dir, { recursive: true, filter: (s) => !s.includes(`${path.sep}dist`) })
  t.teardown(() => fs.rm(dir, { recursive: true, force: true }))
  await fs.writeFile(
    path.join(dir, 'jetpack.config.mjs'),
    'export default { css: { modules: { conventional: "yes" } } }\n'
  )

  await t.throwsAsync(
    options({
      command: 'build',
      dir
    }),
    { message: 'css.modules.conventional must be a boolean.' }
  )
})

test('css-loader source maps follow build.sourceMaps', async (t) => {
  t.true(cssLoader(await stylesheetRule('style.css', 'source-map')).options.sourceMap)
  t.true(cssLoader(await stylesheetRule('style.scss', 'source-map')).options.sourceMap)
  t.false(cssLoader(await stylesheetRule('style.css', false)).options.sourceMap)
  t.false(cssLoader(await stylesheetRule('style.scss', false)).options.sourceMap)
  t.false(cssLoader(await stylesheetRule('style.css', 'eval-source-map')).options.sourceMap)
  t.false(cssLoader(await stylesheetRule('style.scss', 'eval-source-map')).options.sourceMap)
})

test('css chunks use the same filename pattern as entry css', async (t) => {
  const opts = await options({
    command: 'build',
    dir: path.join(fixturesDir, 'pkg-basic'),
    configFile: false
  })
  const plugin = cssExtractPlugin(createRspackConfig(opts).modern)

  t.is(plugin.options.filename, '[name].[contenthash:8].css')
  t.is(plugin.options.chunkFilename, '[name].[contenthash:8].css')
})
