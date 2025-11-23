const express = require('express')
const jetpack = require('../../serve')

const app = express()

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.get('/*splat', jetpack)

const server = app.listen(3000)
server.on('listening', function () {
  console.log('Running server on http://localhost:3000')
})
