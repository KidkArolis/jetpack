import type { ResolvedJetpackConfig } from './index.js'

export type JetpackMiddleware = (req: unknown, res: unknown, next: (err?: unknown) => void) => void

export default function serve(config: ResolvedJetpackConfig): JetpackMiddleware
export { serve }
