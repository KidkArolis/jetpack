import test from 'ava'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import options from '../lib/options.js'
import createRspackConfig from '../lib/rspack.config.js'
import { resolveConfig } from '../index.js'
import { targetQuery } from '../lib/browsers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = (...subdir) => path.join(__dirname, ...subdir)

const base = (pkg, extra = {}) => {
  const defaults = {
    command: 'dev',
    mode: 'development',
    logLevels: { info: false, progress: false, none: false },
    dir: dir('fixtures', pkg),
    entry: '.',
    build: {
      outDir: 'dist',
      sourceMaps: 'source-map',
      minify: true,
      chunkLoadRetry: false
    },
    target: 'modern',
    hot: { enabled: true, quiet: false },
    port: 3030,
    host: 'localhost',
    html: {
      title: 'jetpack',
      cspNonce: false,
      render: null
    },
    proxy: {},
    define: {},
    polyfills: 'usage',
    assetBaseUrl: '/assets/',
    assetBasePathname: '/assets/',
    css: {
      modules: false
    },
    assets: {
      inlineLimit: 8096
    },
    transpileDependencies: true
  }

  return Object.assign({}, defaults, extra, {
    build: Object.assign({}, defaults.build, extra.build),
    html: Object.assign({}, defaults.html, extra.html),
    assets: Object.assign({}, defaults.assets, extra.assets)
  })
}

test('creates options object from cli flags and jetpack.config.js', async (t) => {
  const opts = await options({ command: 'dev', dir: dir('fixtures', 'pkg-swoosh') })
  t.deepEqual(opts, base('pkg-swoosh'))
})

test('accepts explicit overrides', async (t) => {
  const opts = await options({
    command: 'dev',
    entry: 'some/path',
    dir: dir('fixtures', 'pkg-swoosh'),
    overrides: {
      hot: false,
      port: 2800,
      host: '127.0.0.1'
    }
  })
  t.deepEqual(
    opts,
    base('pkg-swoosh', {
      hot: { enabled: false, quiet: false },
      entry: './some/path',
      port: 2800,
      host: '127.0.0.1'
    })
  )
})

test('accepts individual js module as entry', async (t) => {
  const opts = await options({
    command: 'dev',
    entry: './module.js',
    dir: dir('fixtures', 'pkg-individual')
  })
  t.deepEqual(
    opts,
    base('pkg-individual', {
      entry: './module.js'
    })
  )
})

test('defaults to . — rspack resolves via package.json main', async (t) => {
  // pkg-src has package.json with "main": "src/index.js"
  const opts = await options({ command: 'dev', dir: dir('fixtures', 'pkg-src') })
  t.deepEqual(opts, base('pkg-src', { html: { title: 'pkg-src' } }))
})

test('positional `.` is preserved', async (t) => {
  const opts = await options({ command: 'dev', entry: '.', dir: dir('fixtures', 'pkg-src') })
  t.is(opts.entry, '.')
})

test('positional `./` is preserved', async (t) => {
  const opts = await options({ command: 'dev', entry: './', dir: dir('fixtures', 'pkg-src') })
  t.is(opts.entry, './')
})

test('creates options object from jetpack.config.js', async (t) => {
  const opts = await options({
    command: 'dev',
    dir: dir('fixtures', 'pkg-with-config'),
    overrides: {
      log: 'info'
    }
  })
  t.deepEqual(
    opts,
    base('pkg-with-config', {
      port: 1234,
      logLevels: { info: true, progress: false, none: false },
      html: {
        title: 'testing'
      },
      entry: './app/client'
    })
  )
})

test('normalizes grouped build and html config', async (t) => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-options-'))
  await fs.cp(dir('fixtures', 'pkg-src'), projectRoot, { recursive: true })
  t.teardown(() => fs.rm(projectRoot, { recursive: true, force: true }))

  await fs.writeFile(
    path.join(projectRoot, 'jetpack.config.mjs'),
    `export default {
      build: {
        outDir: 'build',
        sourceMaps: false,
        minify: false,
        chunkLoadRetry: true
      },
      html: {
        title: 'Custom',
        cspNonce: true
      },
      assets: {
        inlineLimit: 4096
      }
    }\n`
  )

  const opts = await options({ command: 'build', dir: projectRoot })

  t.is(opts.build.outDir, 'build')
  t.is(opts.build.sourceMaps, false)
  t.is(opts.build.minify, false)
  t.is(opts.build.chunkLoadRetry, true)
  t.is(opts.html.title, 'Custom')
  t.is(opts.html.cspNonce, true)
  t.is(opts.assets.inlineLimit, 4096)
})

test('rejects config options that moved into groups', async (t) => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-options-'))
  await fs.cp(dir('fixtures', 'pkg-src'), projectRoot, { recursive: true })
  t.teardown(() => fs.rm(projectRoot, { recursive: true, force: true }))

  await fs.writeFile(path.join(projectRoot, 'jetpack.config.mjs'), 'export default { minify: false }\n')

  await t.throwsAsync(options({ command: 'build', dir: projectRoot }), { message: 'minify moved to build.minify.' })
})

test('rejects invalid assets config', async (t) => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-options-'))
  await fs.cp(dir('fixtures', 'pkg-src'), projectRoot, { recursive: true })
  t.teardown(() => fs.rm(projectRoot, { recursive: true, force: true }))

  await fs.writeFile(path.join(projectRoot, 'jetpack.config.mjs'), 'export default { assets: { inlineLimit: -1 } }\n')

  await t.throwsAsync(options({ command: 'build', dir: projectRoot }), {
    message: 'assets.inlineLimit must be a non-negative integer.'
  })
})

test('normalizes assetBaseUrl and assetBasePathname', async (t) => {
  const opts = await options({
    command: 'dev',
    dir: dir('fixtures', 'pkg-src'),
    overrides: {},
    config: null
  })
  t.is(opts.assetBaseUrl, '/assets/')
  t.is(opts.assetBasePathname, '/assets/')
})

test('public config export resolves without cli parsing', async (t) => {
  const opts = await resolveConfig({ command: 'dev', dir: dir('fixtures', 'pkg-src') })
  const namedOpts = await options({ command: 'dev', dir: dir('fixtures', 'pkg-src') })
  t.deepEqual(opts, namedOpts)
})

test('accepts string targets', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    overrides: { target: 'all' }
  })
  t.is(opts.target, 'all')
})

test('resolved config does not include cli runtime flags', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    overrides: {
      printConfig: true,
      yes: true,
      dryRun: true,
      coverage: 'US'
    }
  })

  t.false('printConfig' in opts)
  t.false('yes' in opts)
  t.false('dryRun' in opts)
  t.false('coverage' in opts)
})

test('accepts explicit mode independently of command', async (t) => {
  const opts = await options({
    command: 'build',
    mode: 'development',
    dir: dir('fixtures', 'pkg-src')
  })

  t.is(opts.command, 'build')
  t.is(opts.mode, 'development')
  t.is(opts.build.sourceMaps, 'source-map')
})

test('rejects invalid modes', async (t) => {
  await t.throwsAsync(
    options({
      command: 'build',
      mode: 'staging',
      dir: dir('fixtures', 'pkg-src')
    }),
    { message: 'Invalid mode "staging". Expected development or production.' }
  )
})

test('rejects invalid targets', async (t) => {
  await t.throwsAsync(
    options({
      command: 'build',
      dir: dir('fixtures', 'pkg-src'),
      overrides: { target: 'ancient' }
    }),
    { message: 'Invalid target "ancient". Expected modern, legacy, or all.' }
  )
})

test('rejects old target object form', async (t) => {
  await t.throwsAsync(
    options({
      command: 'build',
      dir: dir('fixtures', 'pkg-src'),
      overrides: { target: { modern: true, legacy: true } }
    }),
    { message: 'Invalid target "[object Object]". Expected modern, legacy, or all.' }
  )
})

test('rejects targets that do not apply to the command', async (t) => {
  await t.throwsAsync(
    options({
      command: 'dev',
      dir: dir('fixtures', 'pkg-src'),
      overrides: { target: 'all' }
    }),
    { message: 'Command "dev" only supports one target at a time. Use --target modern or --target legacy.' }
  )
})

test('rejects output paths that point at or outside the project root', async (t) => {
  const src = dir('fixtures', 'pkg-src')
  const projectRootDist = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-options-'))
  const outsideDist = await fs.mkdtemp(path.join(os.tmpdir(), 'jetpack-options-'))
  await fs.cp(src, projectRootDist, { recursive: true })
  await fs.cp(src, outsideDist, { recursive: true })
  t.teardown(() => fs.rm(projectRootDist, { recursive: true, force: true }))
  t.teardown(() => fs.rm(outsideDist, { recursive: true, force: true }))

  await fs.writeFile(path.join(projectRootDist, 'jetpack.config.mjs'), 'export default { build: { outDir: "." } }\n')
  await t.throwsAsync(
    options({
      command: 'build',
      dir: projectRootDist
    }),
    { message: 'outDir must not point to the project root.' }
  )

  await fs.writeFile(
    path.join(outsideDist, 'jetpack.config.mjs'),
    'export default { build: { outDir: "../outside" } }\n'
  )
  await t.throwsAsync(
    options({
      command: 'build',
      dir: outsideDist
    }),
    { message: 'outDir must stay inside the project root.' }
  )
})

test('passes a small public context to the rspack hook', async (t) => {
  const contexts = []
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    overrides: {},
    config: null
  })

  createRspackConfig({
    ...opts,
    rspack(config, context) {
      contexts.push(context)
      return config
    }
  })

  t.deepEqual(
    contexts.map(({ findLoader, ...context }) => {
      t.is(typeof findLoader, 'function')
      return context
    }),
    [{ command: 'build', mode: 'production', target: 'modern', dir: dir('fixtures', 'pkg-src') }]
  )
})

test('passes rspack hook context for each requested target', async (t) => {
  const contexts = []
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    overrides: { target: 'all' },
    config: null
  })

  createRspackConfig({
    ...opts,
    rspack(config, context) {
      contexts.push(context)
      return config
    }
  })

  t.deepEqual(
    contexts.map(({ findLoader, ...context }) => {
      t.is(typeof findLoader, 'function')
      return context
    }),
    [
      { command: 'build', mode: 'production', target: 'modern', dir: dir('fixtures', 'pkg-src') },
      { command: 'build', mode: 'production', target: 'legacy', dir: dir('fixtures', 'pkg-src') }
    ]
  )
})

test('rspack hook context finds generated loaders by name or regex', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null
  })

  const config = createRspackConfig({
    ...opts,
    rspack(config, context) {
      const cssLoaders = context.findLoader('css-loader')
      const sassLoaders = context.findLoader(/sass-loader/)
      const swcLoaders = context.findLoader('builtin:swc-loader')

      t.true(cssLoaders.length >= 2)
      t.true(sassLoaders.length >= 1)
      t.true(swcLoaders.length >= 2)

      for (const loader of cssLoaders) {
        loader.options ??= {}
        loader.options.importLoaders = 7
      }

      return config
    }
  }).modern

  const cssLoaders = config.module.rules[0].oneOf
    .flatMap((rule) => rule.use || [])
    .filter((loader) => loader.loader?.includes('css-loader'))

  t.true(cssLoaders.length >= 2)
  t.true(cssLoaders.every((loader) => loader.options.importLoaders === 7))
})

test('resolves extensionless imports for supported js and typescript files', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null
  })
  const config = createRspackConfig(opts).modern

  t.deepEqual(config.resolve.extensions, ['.tsx', '.ts', '.jsx', '.mjs', '...'])
})

test('production builds split initial and async chunks', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null
  })
  const config = createRspackConfig(opts).modern

  t.true(config.optimization.runtimeChunk)
  t.deepEqual(config.optimization.splitChunks, { chunks: 'all' })
})

test('accepts dependency transpilation options', async (t) => {
  const disabled = await options({
    command: 'dev',
    dir: dir('fixtures', 'pkg-src'),
    overrides: {
      transpileDependencies: false
    }
  })
  t.false(disabled.transpileDependencies)

  const selected = await options({
    command: 'dev',
    dir: dir('fixtures', 'pkg-src'),
    overrides: {
      transpileDependencies: ['@acme/ui', 'modern-lib']
    }
  })
  t.deepEqual(selected.transpileDependencies, ['@acme/ui', 'modern-lib'])

  const excluded = await options({
    command: 'dev',
    dir: dir('fixtures', 'pkg-src'),
    overrides: {
      transpileDependencies: { exclude: ['prebuilt-lib'] }
    }
  })
  t.deepEqual(excluded.transpileDependencies, { include: true, exclude: ['prebuilt-lib'] })
})

test('rejects invalid dependency transpilation options', async (t) => {
  await t.throwsAsync(
    options({
      command: 'dev',
      dir: dir('fixtures', 'pkg-src'),
      overrides: {
        transpileDependencies: 'all'
      }
    }),
    { message: 'transpileDependencies must be true, false, an array, or an object.' }
  )

  await t.throwsAsync(
    options({
      command: 'dev',
      dir: dir('fixtures', 'pkg-src'),
      overrides: {
        transpileDependencies: { exclude: true }
      }
    }),
    { message: 'transpileDependencies.exclude must be an array of package names.' }
  )
})

test('accepts polyfill options', async (t) => {
  const entry = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null,
    overrides: { polyfills: 'entry' }
  })
  t.is(entry.polyfills, 'entry')

  const disabled = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null,
    overrides: { polyfills: false }
  })
  t.false(disabled.polyfills)
})

test('rejects invalid polyfill option', async (t) => {
  await t.throwsAsync(
    options({
      command: 'build',
      dir: dir('fixtures', 'pkg-src'),
      config: null,
      overrides: { polyfills: true }
    }),
    { message: 'polyfills must be "usage", "entry", or false.' }
  )
})

function dependencySwcRule(config) {
  return config.module.rules[0].oneOf.find(
    (rule) =>
      String(rule.test) === String(/\.(js|mjs)$/) && rule.use?.some((loader) => loader.loader === 'builtin:swc-loader')
  )
}

test('transpiles dependencies by default', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null
  })
  const config = createRspackConfig(opts).modern
  const include = dependencySwcRule(config).include

  t.true(include(path.join(opts.dir, 'node_modules', 'modern-lib', 'index.js')))
  t.true(include(path.join(opts.dir, 'node_modules', '@acme', 'ui', 'index.mjs')))
  t.false(include(path.join(opts.dir, 'node_modules', 'core-js', 'index.js')))
})

test('can disable dependency transpilation', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null,
    overrides: {
      transpileDependencies: false
    }
  })
  const config = createRspackConfig(opts).modern
  const include = dependencySwcRule(config).include

  t.false(include(path.join(opts.dir, 'node_modules', 'modern-lib', 'index.js')))
})

test('can limit and exclude dependency transpilation by package name', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null,
    overrides: {
      transpileDependencies: {
        include: ['@acme/ui', 'modern-lib'],
        exclude: ['modern-lib']
      }
    }
  })
  const config = createRspackConfig(opts).modern
  const include = dependencySwcRule(config).include

  t.true(include(path.join(opts.dir, 'node_modules', '@acme', 'ui', 'index.mjs')))
  t.false(include(path.join(opts.dir, 'node_modules', 'modern-lib', 'index.js')))
  t.false(include(path.join(opts.dir, 'node_modules', 'other-lib', 'index.js')))
})

function swcEnv(config) {
  return config.module.rules[0].oneOf.find((rule) => rule.use?.some((loader) => loader.loader === 'builtin:swc-loader'))
    .use[0].options.env
}

test('uses Jetpack modern defaults when no browserslist config exists', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null
  })
  const config = createRspackConfig(opts).modern

  const targets = targetQuery({ ...opts, bundleTarget: 'modern' })

  t.deepEqual(config.target, ['web', `browserslist:${targets.join(', ')}`])
  t.deepEqual(swcEnv(config).targets, targets)
})

test('uses browserslist defaults for legacy when no browserslist config exists', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null,
    overrides: { target: 'legacy' }
  })
  const config = createRspackConfig(opts).legacy

  const targets = targetQuery({ ...opts, bundleTarget: 'legacy' })

  t.deepEqual(config.target, ['web', `browserslist:${targets.join(', ')}`])
  t.deepEqual(swcEnv(config).targets, targets)
})

test('uses project browserslist config when present', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-basic'),
    config: null
  })
  const config = createRspackConfig(opts).modern
  const targets = targetQuery({ ...opts, bundleTarget: 'modern' })

  t.deepEqual(config.target, ['web', `browserslist:${targets.join(', ')}`])
  t.deepEqual(swcEnv(config).targets, targets)
})

test('passes polyfill mode to swc env', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null,
    overrides: { polyfills: 'entry' }
  })
  const env = swcEnv(createRspackConfig(opts).modern)

  t.is(env.mode, 'entry')
  t.truthy(env.coreJs)
})

test('can disable core-js polyfills in swc env', async (t) => {
  const opts = await options({
    command: 'build',
    dir: dir('fixtures', 'pkg-src'),
    config: null,
    overrides: { polyfills: false }
  })
  const env = swcEnv(createRspackConfig(opts).modern)

  t.false('mode' in env)
  t.false('coreJs' in env)
  t.true('targets' in env)
})
