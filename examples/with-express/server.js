const express = require('express')
const options = require('../../options')
const jetpack = require('../../serve')

const app = express()

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.get('*', jetpack)

app.listen(options.port)
