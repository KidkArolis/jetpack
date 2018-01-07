const server = require('../../../server')
const options = require('../../../options')

const app = server()

const data = () => ({ data: Date.now() })

app.get('/api/data', (req, res) => {
  res.send(data())
})

app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' />
        <title>Hello World</title>
      </head>
      <body>
        <div id='root'></div>
        <script>
        var DATA = ${JSON.stringify(data())}
        </script>
        <script type='text/javascript' src='${options.bundle}'></script>
      </body>
    </html>
  `)
})

app.listen()
