import test from 'ava'
import path from 'path'
import execa from 'execa'
import fs from 'fs-extra'
import klaw from 'klaw'

test('build basic', async t => {
  await build(t, 'pkg-basic')
})

test('build with all the features', async t => {
  await build(t, 'pkg-with-everything')
})

test('build with postcss config', async t => {
  await build(t, 'pkg-with-postcss-config')
})

test('build with scss', async t => {
  await build(t, 'pkg-with-scss')
})

test('build with cjs modules and core-js polyfill', async t => {
  const output = await build(t, 'pkg-with-cjs')
  const manifest = JSON.parse(output['/assets/manifest.json'])
  const bundle = output[manifest['bundle.js']]
  t.true(bundle.includes('// `String.prototype.trim` method'))
  t.notThrows(() => eval(bundle)) // eslint-disable-line
})

test('build with esm modules and core-js polyfill', async t => {
  const output = await build(t, 'pkg-with-esm')
  const manifest = JSON.parse(output['/assets/manifest.json'])
  const bundle = output[manifest['bundle.js']]
  t.true(bundle.includes('// `String.prototype.trim` method'))
  t.notThrows(() => eval(bundle)) // eslint-disable-line
})

test('build both modern and legacy bundles', async t => {
  const output = await build(t, 'pkg-with-legacy')

  const manifest = JSON.parse(output['/assets/manifest.json'])
  const bundle = output[manifest['bundle.js']]
  t.true(bundle.includes(`const test = async () => 'test  '.trim();`))

  const legacyManifest = JSON.parse(output['/assets/manifest.legacy.json'])
  const legacyBundle = output[legacyManifest['bundle.js']]
  t.true(legacyBundle.includes(`return _context.abrupt("return", 'test  '.trim());`))

  t.notThrows(() => eval(bundle)) // eslint-disable-line
})

async function build (t, pkg) {
  const base = path.join('.', 'test', 'fixtures', pkg)
  const dist = path.join(process.cwd(), base, 'dist')

  await fs.remove(dist)

  const result = await execa.node('./bin/jetpack', ['build', '--dir', base], {
    env: {},
    extendEnv: false
  })

  // console.log(result.all)

  if (result.exitCode !== 0) {
    console.log('Failed to build')
    console.log(result.stdout)
    console.log(result.stderr)
    t.true(false)
  }

  const files = []
  await new Promise((resolve, reject) => {
    klaw(dist)
      .on('readable', function () {
        let item
        while ((item = this.read())) {
          if (!item.stats.isDirectory()) {
            files.push(item.path)
          }
        }
      })
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
  })

  const output = {}
  for (const file of files) {
    const contents = (await fs.readFile(file)).toString()
    t.snapshot(contents, file.replace(path.join(__dirname, '..'), ''))
    output[file.replace(dist, '')] = contents
  }
  return output
}
