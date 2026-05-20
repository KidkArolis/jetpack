import rspack, { DefinePlugin } from '../../rspack.js'
import createRspackConfig from '../../rspack-config.js'
import serve from '../../serve.js'
import defineConfig, { resolveConfig, type JetpackConfig, type JetpackHtmlRenderContext } from '../../index.js'
import { html, renderHtmlResponse } from '../../html.js'

const config = defineConfig({
  entry: './src/index.ts',
  port: 3030,
  host: 'localhost',
  assetBaseUrl: '/assets/',
  hot: { quiet: true },
  target: 'all',
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
  proxy: {
    '/api/*': 'http://localhost:3000'
  },
  rspack(rspackConfig, context) {
    const target: 'modern' | 'legacy' = context.target
    rspackConfig.plugins ??= []
    return target ? rspackConfig : undefined
  }
} satisfies JetpackConfig)

const resolved = await resolveConfig({
  command: 'build',
  dir: process.cwd(),
  overrides: {
    target: config.target,
    minify: false
  }
})

const target: 'modern' | 'legacy' | 'all' = resolved.target
const configs = await createRspackConfig({ command: 'build' }, { target })
const middleware = serve(resolved)
const renderedTemplate = html`<div>${target}</div>`

renderHtmlResponse(renderedTemplate, { cspNonce: 'nonce' })
new DefinePlugin({ __TEST__: JSON.stringify(true) })
rspack(configs.modern ?? {})
middleware({}, {}, () => {})
