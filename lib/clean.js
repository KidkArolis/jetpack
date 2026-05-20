import fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'
import pc from 'picocolors'

function confirm({ question, default: defaultValue = false }) {
  return new Promise((resolve, reject) => {
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
        if (defaultValue) {
          resolve()
        } else {
          reject(new Error('No input provided'))
        }
        return
      }

      // Check for yes responses
      if (normalized === 'y' || normalized === 'yes') {
        resolve()
      } else {
        reject(new Error('User cancelled'))
      }
    })
  })
}

export default async function clean(options, log) {
  const target = path.join(options.dir, options.outDir)

  try {
    if (options.dryRun) {
      log?.info(`Would remove ${target}`)
      return
    }

    if (!options.yes) {
      await confirm({
        question: `Are you sure you want to remove ${target}?`,
        default: false
      })
    }

    await fs.rm(target, { recursive: true, force: true })
  } catch {
    // nothing happens
  }
}
