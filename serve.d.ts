import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ResolveConfigInput, ResolvedJetpackConfig } from './index.js'

export interface JetpackResponse extends ServerResponse {
  locals?: {
    cspNonce?: string
    [key: string]: unknown
  }
}
export type JetpackMiddleware = (req: IncomingMessage, res: JetpackResponse, next: (err?: unknown) => void) => void
export interface JetpackServeOptions extends Omit<ResolveConfigInput, 'command'> {
  command?: 'dev' | 'build'
}

export function serve(options?: JetpackServeOptions): JetpackMiddleware
export function serveResolved(config: ResolvedJetpackConfig): JetpackMiddleware
export default serve
