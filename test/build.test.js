import test from 'ava'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('build basic', async (t) => {
  await build(t, 'pkg-basic')
})

test('build with all the features', async (t) => {
  await build(t, 'pkg-with-everything')
})

test('build with lightningcss syntax lowering', async (t) => {
  const output = await build(t, 'pkg-with-lightningcss')

  const base = path.join(__dirname, 'fixtures', 'pkg-with-lightningcss')
  const inputCssPath = path.join(base, 'styles.css')
  const inputCss = (await fs.readFile(inputCssPath)).toString()

  t.true(
    inputCss.includes(
      `
.logo {
  backdrop-filter: blur(10px);
  background: yellow;
}

.button {
  -webkit-transition: background 200ms;
  -moz-transition: background 200ms;
  transition: background 200ms;
}
    `.trim()
    )
  )

  const outputPaths = Object.keys(output)
  const outputCssFile = outputPaths.find((f) => f.endsWith('.css'))
  const outputCss = output[outputCssFile]

  t.true(
    outputCss.includes(
      `
.logo {
  backdrop-filter: blur(10px);
  background: #ff0;
}

.button {
  transition: background .2s;
}
  `.trim()
    )
  )
})

test('build with scss', async (t) => {
  await build(t, 'pkg-with-scss')
})

test('build with cjs modules for modern js', async (t) => {
  const output = await build(t, 'pkg-with-cjs')
  const bundle = output['/assets/bundle.js']
  t.true(bundle.includes(`'test  '.trim()`))
  t.notThrows(() => eval(bundle)) // oxlint-disable-line no-eval
})

test('build with esm modules for modern js', async (t) => {
  const output = await build(t, 'pkg-with-esm')
  const bundle = output['/assets/bundle.js']
  t.true(bundle.includes(`'test  '.trim()`))
  t.notThrows(() => eval(bundle)) // oxlint-disable-line no-eval
})

test('build both modern and legacy bundles', async (t) => {
  const output = await build(t, 'pkg-with-legacy')

  const bundle = output['/assets/bundle.js']
  t.true(bundle.includes(`const test = async ()=>'test  '.trim();`))

  const legacyBundle = output['/assets/bundle.legacy.js']
  t.true(
    legacyBundle.includes(`var test = ()=>_async_to_generator(function*() {
        return 'test  '.trim();
    })();`)
  )
  t.true(legacyBundle.includes('// `String.prototype.trim` method'))

  t.true(legacyBundle.includes('`Array.prototype.toReversed` method'))

  t.notThrows(() => eval(bundle)) // oxlint-disable-line no-eval
})

async function build(t, pkg) {
  const base = path.join(__dirname, 'fixtures', pkg)
  const dist = path.join(base, 'dist')

  await fs.rm(dist, { recursive: true, force: true })

  // on purpose do not run in root of jetpack to ensure we're not
  // accidentally using something from node_modules
  const result = await runNode(path.join(__dirname, '..', 'bin', 'jetpack'), ['build', '--log=info', '--dir', base], {
    cwd: os.tmpdir(),
    env: {}
  })

  t.snapshot(
    result.all
      .replace(/^jetpack › Built in.*$/gm, '')
      .split('\n')
      .sort()
      .join('\n'),
    `jetpack output for compiling ${pkg}`
  )

  if (result.exitCode !== 0) {
    console.log('Failed to build')
    console.log(result.stdout)
    console.log(result.stderr)
    t.true(false)
  }

  const entries = await fs.readdir(dist, { recursive: true, withFileTypes: true })
  const files = entries.filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name))

  const output = {}
  for (const file of files) {
    const relativeFile = file.replace(dist, '')
    const contents = (await fs.readFile(file)).toString()
    t.snapshot(contents, file.replace(path.join(__dirname, '..'), ''))
    output[relativeFile] = contents
    if (relativeFile.startsWith('/assets/bundle.') && relativeFile.endsWith('.js')) {
      if (relativeFile.endsWith('.legacy.js')) {
        output['/assets/bundle.legacy.js'] = contents
      } else {
        output['/assets/bundle.js'] = contents
      }
    }
  }
  return output
}

function runNode(script, args, opts) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [script, ...args], opts)
    const all = []
    const stdout = []
    const stderr = []
    p.stdout.on('data', (chunk) => {
      all.push(chunk)
      stdout.push(chunk)
    })
    p.stderr.on('data', (chunk) => {
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
