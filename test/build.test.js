import test from 'ava'
import path from 'path'
import execa from 'execa'
import rimraf from 'rimraf-then'
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

async function build (t, pkg) {
  const base = path.join('.', 'test', 'fixtures', pkg)
  const dist = path.join(base, 'dist')

  console.log(base)
  console.log(dist)

  await rimraf(dist)

  await execa.shell(`./bin/jetpack build --dir ${base}`, {
    env: {},
    extendEnv: false
  })

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

  for (const file of files) {
    const contents = (await fs.readFile(file)).toString()
    t.snapshot(contents, file.replace(path.join(__dirname, '..'), ''))
  }
}
