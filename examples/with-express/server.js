const express = require('express')
const options = require('../../options')
const handle = require('../../handle')

const app = express()

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.get('/client/*', handle)
app.get('*', handle)

app.listen(options.port)
