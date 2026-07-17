import express from 'express'
import { serve } from '../../serve.js'

const app = express()

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.use(serve())

const server = app.listen(3000)
server.on('listening', function () {
  console.log('Running server on http://localhost:3000')
})
