import express from 'express'
import { resolveConfig } from '../../index.js'
import { serve } from '../../serve.js'

const app = express()
const jetpack = serve(
  await resolveConfig({
    command: process.env.NODE_ENV === 'production' ? 'build' : 'dev'
  })
)

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.get('/*splat', jetpack)

const server = app.listen(3000)
server.on('listening', function () {
  console.log('Running server on http://localhost:3000')
})
