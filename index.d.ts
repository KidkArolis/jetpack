import type { Configuration as RspackConfig, RuleSetLoaderWithOptions } from '@rspack/core'

export type JetpackCommand = 'dev' | 'build' | 'inspect' | 'browsers' | 'clean'
export type JetpackMode = 'development' | 'production'
export type JetpackTarget = 'modern' | 'legacy' | 'all'
export type JetpackBundleTarget = 'modern' | 'legacy'
export type JetpackLogLevel = 'info' | 'progress' | 'all' | 'silent' | 'none'
export type JetpackPolyfills = 'usage' | 'entry' | false
export interface JetpackRspackLoader extends Omit<RuleSetLoaderWithOptions, 'options'> {
  options?: Record<string, any>
}

export interface JetpackRspackContext {
  command: JetpackCommand
  mode: JetpackMode
  target: JetpackBundleTarget
  dir: string
  findLoader: (name: string | RegExp) => JetpackRspackLoader[]
}

export interface JetpackHotConfig {
  enabled?: boolean
  quiet?: boolean
}

export interface JetpackBuildConfig {
  outDir?: string
  sourceMaps?: boolean | string | undefined
  minify?: boolean
  chunkLoadRetry?: boolean | Record<string, unknown>
}

export interface JetpackHtmlRenderContext extends Omit<ResolvedJetpackConfig, 'html'> {
  html: typeof String.raw
  title: string
  manifest: JetpackManifest
  cspNonce: string | null
  cspNonceAttr: string
  tags: {
    css: string
    runtime: string
    js: string
  }
}

export interface JetpackHtmlConfig {
  title?: string
  cspNonce?: boolean
  render?: string | ((context: JetpackHtmlRenderContext) => string) | null
}

export interface JetpackCssModulesConfig {
  conventional?: boolean
  [option: string]: unknown
}

export interface JetpackCssConfig {
  modules?: boolean | JetpackCssModulesConfig
}

export interface JetpackAssetsConfig {
  inlineLimit?: number
}

export type JetpackTranspileDependenciesConfig =
  | boolean
  | string[]
  | {
      include?: boolean | string[]
      exclude?: string[]
    }

export type JetpackProxyConfig = Record<string, string> | ((app: unknown) => void)

export interface JetpackConfig {
  entry?: string
  port?: number | string
  host?: string
  assetBaseUrl?: string
  hot?: boolean | JetpackHotConfig
  target?: JetpackTarget
  polyfills?: JetpackPolyfills
  define?: Record<string, unknown>
  proxy?: JetpackProxyConfig
  log?: JetpackLogLevel | string
  build?: JetpackBuildConfig
  html?: JetpackHtmlConfig
  css?: JetpackCssConfig
  assets?: JetpackAssetsConfig
  transpileDependencies?: JetpackTranspileDependenciesConfig
  rspack?: (config: RspackConfig, context: JetpackRspackContext) => RspackConfig | void
}

export interface ResolveConfigInput {
  command?: JetpackCommand
  mode?: JetpackMode
  dir?: string
  entry?: string | null
  configFile?: string | false | null
  overrides?: Partial<JetpackConfig> & {
    minify?: boolean
    printConfig?: boolean
    yes?: boolean
    dryRun?: boolean
    coverage?: string | false
  }
}

export interface ResolvedJetpackBuildConfig {
  outDir: string
  sourceMaps: boolean | string | undefined
  minify: boolean
  chunkLoadRetry: boolean | Record<string, unknown>
}

export interface ResolvedJetpackHotConfig {
  enabled: boolean
  quiet: boolean
}

export interface ResolvedJetpackHtmlConfig {
  title: string
  cspNonce: boolean
  render: string | ((context: JetpackHtmlRenderContext) => string) | null
}

export interface ResolvedJetpackCssConfig {
  modules: boolean | JetpackCssModulesConfig
}

export interface ResolvedJetpackAssetsConfig {
  inlineLimit: number
}

export interface ResolvedJetpackConfig {
  command: JetpackCommand
  mode: JetpackMode
  dir: string
  entry: string
  port: number | string
  host: string
  build: ResolvedJetpackBuildConfig
  assetBaseUrl: string
  assetBasePathname: string
  hot: ResolvedJetpackHotConfig
  define: Record<string, unknown>
  polyfills: JetpackPolyfills
  target: JetpackTarget
  proxy: JetpackProxyConfig
  logLevels: {
    info: boolean
    progress: boolean
    none: boolean
  }
  html: ResolvedJetpackHtmlConfig
  css: ResolvedJetpackCssConfig
  assets: ResolvedJetpackAssetsConfig
  transpileDependencies: JetpackTranspileDependenciesConfig
  rspack?: (config: RspackConfig, context: JetpackRspackContext) => RspackConfig | void
}

export interface JetpackManifest {
  js: string[]
  css: string[]
  runtime: string[]
  other: string[]
  inlineRuntime?: string | null
}

export default function defineConfig<T extends JetpackConfig>(config: T): T
export { defineConfig }
export function resolveConfig(input?: ResolveConfigInput): Promise<ResolvedJetpackConfig>
