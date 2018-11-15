const polka = require('polka')
const jetpack = require('../../serve')

const app = polka()

app.get('/api/data', (req, res) => {
  res.end('hello')
})

app.get('/*', jetpack)

app.listen(3000, function () {
  console.log('Running server on http://localhost:3000')
})
