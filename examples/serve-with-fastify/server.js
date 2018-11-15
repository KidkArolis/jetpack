const fastify = require('fastify')
const jetpack = require('../../serve')

const app = fastify({ logger: true })

app.get('/api/data', (req, res) => {
  res.send('hello')
})

app.get('/*', (req, res) => {
  jetpack(req.req, res.res).then(() => {
     reply.sent = true
  })
})

app.listen(3000, function () {
  console.log('Running server on http://localhost:3000')
})
