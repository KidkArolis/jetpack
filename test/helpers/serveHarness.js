import express from 'express'
import jetpackServe from '../../serve.js'

const app = express()
app.use((_req, res, next) => {
  if (process.env.CSP_NONCE) {
    res.locals.cspNonce = process.env.CSP_NONCE
  }
  next()
})
app.use(jetpackServe)

const port = Number(process.env.PORT)
app.listen(port, () => {
  console.log(`harness listening on ${port}`)
})
