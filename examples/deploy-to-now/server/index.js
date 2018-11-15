const polka = require('polka')

const app = polka()

app.get('/api/unicorn', function (req, res) {
  res.end('🦄')
})

app.listen(3040, function () {
  console.log('API running at http://localhost:3040')
})
