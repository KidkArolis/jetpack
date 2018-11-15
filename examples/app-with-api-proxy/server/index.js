const express = require('express')
const morgan = require('morgan')

const app = express()

app.use(morgan('short'))

app.get('/api/unicorn', function (req, res) {
  res.send('🦄')
})

app.listen(3040, function () {
  console.log('API running at http://localhost:3040')
})
