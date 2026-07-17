import fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'
import pc from 'picocolors'

function confirm({ question, default: defaultValue = false }) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const defaultHint = defaultValue ? '(Y/n)' : '(y/N)'
    const prompt = `${pc.green('?')} ${pc.gray(question)} ${pc.gray(defaultHint)} `

    rl.question(prompt, (answer) => {
      rl.close()

      const normalized = answer.trim().toLowerCase()

      // If empty, use default value
      if (normalized === '') {
        resolve(defaultValue)
        return
      }

      // Check for yes responses
      resolve(normalized === 'y' || normalized === 'yes')
    })
  })
}

export default async function clean(options, log, runtime = {}) {
  const target = path.join(options.dir, options.build.outDir)

  if (runtime.dryRun) {
    log?.info(`Would remove ${target}`)
    return
  }

  const confirmed =
    runtime.yes ||
    (await confirm({
      question: `Are you sure you want to remove ${target}?`,
      default: false
    }))
  if (!confirmed) return

  await fs.rm(target, { recursive: true, force: true })
}
