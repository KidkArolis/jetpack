import test from 'ava'
import execa from 'execa'
import rimraf from 'rimraf-then'
import fs from 'fs-extra'
import klaw from 'klaw'

test('build with all the features', async t => {
  await rimraf('./test/fixtures/pkg-with-everything/dist')
  await execa.shell('./bin/jetpack build --dir ./test/fixtures/pkg-with-everything', {
    env: {},
    extendEnv: false
  })

  const files = []
  await new Promise((resolve, reject) => {
    klaw('./test/fixtures/pkg-with-everything/dist')
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
    t.snapshot(contents)
  }

  t.pass()
})
