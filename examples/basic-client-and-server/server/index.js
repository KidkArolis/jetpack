const server = require('../../../server')
const options = require('../../../options')

const app = server()

app.get('/api/data', (req, res) => {
  res.send({ data: 123 })
})

// app.get('*', (req, res) => {
//   res.send(`
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset='utf-8' />
//         <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' />
//         <title>Hello World</title>
//       </head>
//       <body>
//         <div id='root'></div>
//         <script type='text/javascript' src='/dist/bundle.js'></script>
//       </body>
//     </html>
//   `)
// })

app.listen()
