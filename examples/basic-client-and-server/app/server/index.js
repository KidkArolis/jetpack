const server = require('../../../../server')

const app = server()

app.get('/api/data', (req, res) => {
  res.send({ data: Date.now() })
})

app.listen()
