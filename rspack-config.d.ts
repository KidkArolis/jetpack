import type { Configuration as RspackConfig } from '@rspack/core'
import type { JetpackTarget, ResolveConfigInput } from './index.js'

export default function createJetpackRspackConfig(
  input?: ResolveConfigInput,
  runtime?: { target?: JetpackTarget }
): Promise<Partial<Record<'modern' | 'legacy', RspackConfig>>>
