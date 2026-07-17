import fastify from 'fastify'
import { serve } from '../../serve.js'

const app = fastify({ logger: true })
const jetpack = serve()

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.get('/*', (req, res) => {
  res.hijack()
  jetpack(req.raw, res.raw, (err) => {
    if (err && !res.raw.destroyed) res.raw.destroy(err)
  })
})

app.listen({ port: 3000 }, function () {
  console.log('Running server on http://localhost:3000')
})
