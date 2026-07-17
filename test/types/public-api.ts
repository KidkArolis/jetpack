import rspack, { DefinePlugin } from '../../rspack.js'
import createRspackConfig from '../../rspack-config.js'
import serve, { serveResolved } from '../../serve.js'
import defineConfig, { resolveConfig, type JetpackConfig, type JetpackHtmlRenderContext } from '../../index.js'
import { html, renderHtmlResponse } from '../../html.js'

const config = defineConfig({
  entry: './src/index.ts',
  port: 3030,
  host: 'localhost',
  assetBaseUrl: '/assets/',
  hot: { quiet: true },
  dev: { overlay: true },
  target: 'all',
  polyfills: 'usage',
  define: {
    __BUILD__: 'smoke'
  },
  build: {
    outDir: 'dist',
    sourceMaps: true,
    minify: false,
    chunkLoadRetry: { maxRetries: 3 }
  },
  html: {
    cspNonce: true,
    render(context: JetpackHtmlRenderContext) {
      return context.html`<!doctype html>${context.tags.css}${context.tags.js}`
    }
  },
  css: {
    modules: {
      conventional: true,
      localIdentName: '[name]__[local]'
    }
  },
  assets: {
    inlineLimit: 4096
  },
  transpileDependencies: {
    include: true,
    exclude: ['prebuilt-lib']
  },
  rspack(rspackConfig, context) {
    const target: 'modern' | 'legacy' = context.target
    const swcLoaders = context.findLoader('builtin:swc-loader')
    const cssLoaders = context.findLoader(/css-loader/)
    rspackConfig.plugins ??= []
    for (const loader of swcLoaders) {
      const loaderName: string = loader.loader
      void loaderName
    }
    for (const loader of cssLoaders) {
      loader.options ??= {}
      loader.options.modules = {}
    }
    return target ? rspackConfig : undefined
  }
} satisfies JetpackConfig)

// @ts-expect-error The proxy config option was removed in Jetpack 5.
defineConfig({ proxy: {} } satisfies JetpackConfig)

const resolved = await resolveConfig({
  command: 'build',
  dir: process.cwd(),
  configFile: false,
  overrides: {
    target: config.target,
    minify: false
  }
})

const target: 'modern' | 'legacy' | 'all' = resolved.target
const polyfills: 'usage' | 'entry' | false = resolved.polyfills
const inlineLimit: number = resolved.assets.inlineLimit
const configs = await createRspackConfig({ command: 'build' }, { target })
const lazyMiddleware = serve({ dir: process.cwd() })
const lowLevelMiddleware = serveResolved(resolved)
// @ts-expect-error Resolved configs use the explicit serveResolved API.
serve(resolved)
// @ts-expect-error serve.resolve was removed in Jetpack 5.
serve.resolve({ dir: process.cwd() })
const renderedTemplate = html`<div>${target}</div>`

renderHtmlResponse(renderedTemplate, { cspNonce: 'nonce' })
new DefinePlugin({ __TEST__: JSON.stringify(true) })
rspack(configs.modern ?? {})
lazyMiddleware({}, {}, () => {})
lowLevelMiddleware({}, {}, () => {})
void inlineLimit
void polyfills
