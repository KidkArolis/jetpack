const fs = require('fs')
const path = require('path')

module.exports = function render (options) {
  // TOOD - make async and cached
  // TODO - allow html to be a js module that's required and expects to return
  // ~promise of the html.
  // Could this go even further with the `pages` concept and route matching..?
  if (options.html) {
    return fs
      .readFileSync(path.join(process.cwd(), options.html))
      .toString()
      .replace('{{name}}', options.pkg.name)
      .replace('{{bundle}}', options.bundle)
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' />
        <title>${options.pkg.name}</title>
      </head>
      <body>
        <div id='root'></div>
        ${options.assets.map(asset =>
          `<script type='text/javascript' src='${asset}'></script>`
        ).join('\n')}
      </body>
    </html>
  `
}
