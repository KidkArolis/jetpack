export const CSP_NONCE_PLACEHOLDER = '__JETPACK_CSP_NONCE__'
export const html = String.raw

export function renderHtml(options) {
  const ctx = htmlContext(options)

  if (typeof options.html === 'function') {
    return options.html(ctx)
  }

  if (typeof options.html === 'string') {
    return options.html
  }

  return defaultHtml(ctx)
}

export function renderHtmlResponse(html, { cspNonce } = {}) {
  if (!cspNonce) return html
  return html.replaceAll(CSP_NONCE_PLACEHOLDER, cspNonce)
}

export function htmlContext(options) {
  const cspNonce = options.cspNonce ? CSP_NONCE_PLACEHOLDER : null
  const cspNonceAttr = cspNonce ? `nonce="${cspNonce}"` : ''

  return Object.assign({}, options, {
    html,
    cspNonce,
    cspNonceAttr,
    tags: {
      css: renderCssTags(options.assets.css),
      runtime: renderRuntimeTag(options.runtime, { cspNonceAttr }),
      js: renderJsTags(options.assets.js, { cspNonceAttr })
    }
  })
}

function defaultHtml({ title, tags }) {
  const bodyTags = ['<div id="root"></div>', tags.runtime, tags.js].filter(Boolean).join('\n    ')

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>${escapeHtml(title)}</title>
    ${tags.css}
  </head>
  <body>
    ${bodyTags}
  </body>
</html>
`
}

function renderCssTags(assets) {
  return assets.map((asset) => `<link rel="stylesheet" href="${escapeAttr(asset)}">`).join('\n    ')
}

function renderRuntimeTag(runtime, { cspNonceAttr }) {
  if (!runtime) return ''

  return html`<script${attr(cspNonceAttr)}>
${runtime}
</script>`
}

function renderJsTags(assets, { cspNonceAttr }) {
  return assets.map((asset) => `<script src="${escapeAttr(asset)}"${attr(cspNonceAttr)} async></script>`).join('\n    ')
}

function attr(value) {
  return value ? ` ${value}` : ''
}

function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
