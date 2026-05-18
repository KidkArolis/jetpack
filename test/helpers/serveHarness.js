import express from 'express'
import jetpackServe from '../../serve.js'

const app = express()
app.use(jetpackServe)

const port = Number(process.env.PORT)
app.listen(port, () => {
  console.log(`harness listening on ${port}`)
})
