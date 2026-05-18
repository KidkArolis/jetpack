import net from 'node:net'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jetpackBin = path.join(__dirname, '..', '..', 'bin', 'jetpack')

export function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

// Spawn a node script, wait for the process to exit, return captured output.
export function runNode(script, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [script, ...args], opts)
    const all = []
    const stdout = []
    const stderr = []
    p.stdout?.on('data', (chunk) => {
      all.push(chunk)
      stdout.push(chunk)
    })
    p.stderr?.on('data', (chunk) => {
      all.push(chunk)
      stderr.push(chunk)
    })
    p.on('error', reject)
    p.on('close', (exitCode) => {
      resolve({
        exitCode,
        all: Buffer.concat(all).toString('utf8'),
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8')
      })
    })
  })
}

// Spawn a long-running node script and resolve once stdout matches `readyMatcher`.
// Returns a handle with .kill() and .output().
export async function startNode(script, args = [], { readyMatcher, env, cwd, timeout = 15000 } = {}) {
  const p = spawn(process.execPath, [script, ...args], { stdio: ['ignore', 'pipe', 'pipe'], env, cwd })
  let output = ''
  const onChunk = (chunk) => {
    output += chunk.toString()
  }
  p.stdout.on('data', onChunk)
  p.stderr.on('data', onChunk)

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`startNode timed out waiting for output match. Output:\n${output}`))
    }, timeout)
    const check = () => {
      if (readyMatcher.test(output)) {
        clearTimeout(timer)
        p.stdout.off('data', checkOnChunk)
        p.stderr.off('data', checkOnChunk)
        resolve()
      }
    }
    const checkOnChunk = () => check()
    p.stdout.on('data', checkOnChunk)
    p.stderr.on('data', checkOnChunk)
    p.once('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`Process exited (${code}) before match. Output:\n${output}`))
    })
    check()
  })

  return {
    pid: p.pid,
    output: () => output,
    kill: () =>
      new Promise((resolve) => {
        if (p.exitCode !== null) return resolve()
        p.once('exit', () => resolve())
        p.kill('SIGTERM')
      })
  }
}

export async function startJetpack(args = [], opts = {}) {
  return startNode(jetpackBin, args, opts)
}

export function runJetpack(args = [], opts = {}) {
  return runNode(jetpackBin, args, opts)
}
