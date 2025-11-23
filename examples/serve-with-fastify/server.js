const fastify = require('fastify')
const jetpack = require('../../serve')

const app = fastify({ logger: true })

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.get('/*', (req, res) => {
  jetpack(req.raw, res.raw).then(() => {
     res.hijack()
  })
})

app.listen({ port: 3000 }, function () {
  console.log('Running server on http://localhost:3000')
})
