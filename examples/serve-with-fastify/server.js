import fastify from 'fastify'
import { resolveConfig } from '../../index.js'
import { serve } from '../../serve.js'

const app = fastify({ logger: true })
const jetpack = serve(
  await resolveConfig({
    command: process.env.NODE_ENV === 'production' ? 'build' : 'dev'
  })
)

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.get('/*', (req, res) => {
  jetpack(req.raw, res.raw, () => {})
  res.hijack()
})

app.listen({ port: 3000 }, function () {
  console.log('Running server on http://localhost:3000')
})
