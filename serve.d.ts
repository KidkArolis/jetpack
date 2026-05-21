import type { ResolveConfigInput, ResolvedJetpackConfig } from './index.js'

export type JetpackMiddleware = (req: unknown, res: unknown, next: (err?: unknown) => void) => void
export interface JetpackServeOptions extends Omit<ResolveConfigInput, 'command'> {
  command?: 'dev' | 'build'
}

export function serve(options?: JetpackServeOptions | ResolvedJetpackConfig): JetpackMiddleware
export namespace serve {
  function resolve(options?: JetpackServeOptions | ResolvedJetpackConfig): Promise<JetpackMiddleware>
}
export function serveResolved(config: ResolvedJetpackConfig): JetpackMiddleware
export default serve
