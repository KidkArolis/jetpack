const express = require('express')
const morgan = require('morgan')
const jetpack = require('../../../../handle')

const app = express()

app.use(morgan('dev'))

app.get('/api/data', (req, res) => {
  res.send({ data: Date.now() })
})

app.get('*', jetpack)

app.listen(3000, function () {
  console.log('Server running on http://localhost:3000')
})
