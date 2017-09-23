module.exports = function render (props) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' />
        <title>${props.name}</title>
      </head>
      <body>
        <div id='root'></div>
        <script type='text/javascript' src='/dist/bundle.js'></script>
      </body>
    </html>
  `
}
