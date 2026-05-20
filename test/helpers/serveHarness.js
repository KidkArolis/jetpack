import express from 'express'
import { resolveConfig } from '../../index.js'
import { serve } from '../../serve.js'

const app = express()
app.use((_req, res, next) => {
  if (process.env.CSP_NONCE) {
    res.locals.cspNonce = process.env.CSP_NONCE
  }
  next()
})

const config = await resolveConfig({
  command: process.env.NODE_ENV === 'production' ? 'build' : 'dev',
  dir: process.cwd()
})
app.use(serve(config))

const port = Number(process.env.PORT)
app.listen(port, () => {
  console.log(`harness listening on ${port}`)
})
