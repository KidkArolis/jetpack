export const CSP_NONCE_PLACEHOLDER = '__JETPACK_CSP_NONCE__'
export const html = String.raw

export function renderHtml(options, manifest) {
  const ctx = htmlContext(options, manifest)
  let rendered

  if (typeof options.html.render === 'function') {
    rendered = options.html.render(ctx)
  } else if (typeof options.html.render === 'string') {
    rendered = options.html.render
  } else {
    rendered = defaultHtml(ctx)
  }

  const html = options.command === 'dev' ? addCrossOriginToScripts(rendered, manifest.js) : rendered
  return html.trimStart()
}

export function renderHtmlResponse(html, { cspNonce } = {}) {
  if (!cspNonce) return html
  return html.replaceAll(CSP_NONCE_PLACEHOLDER, cspNonce)
}

export function htmlContext(options, manifest) {
  const cspNonce = options.html.cspNonce ? CSP_NONCE_PLACEHOLDER : null
  const cspNonceAttr = cspNonce ? `nonce="${cspNonce}"` : ''
  const crossOriginAttr = options.command === 'dev' ? 'crossorigin="anonymous"' : ''

  return Object.assign({}, options, {
    html,
    title: options.html.title,
    manifest,
    cspNonce,
    cspNonceAttr,
    tags: {
      css: renderCssTags(manifest.css),
      runtime: renderRuntimeTag(manifest.inlineRuntime, { cspNonceAttr }),
      js: renderJsTags(manifest.js, { cspNonceAttr, crossOriginAttr })
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

function renderJsTags(assets, { cspNonceAttr, crossOriginAttr }) {
  return assets
    .map((asset) => `<script src="${escapeAttr(asset)}"${attr(cspNonceAttr)}${attr(crossOriginAttr)} defer></script>`)
    .join('\n    ')
}

function addCrossOriginToScripts(source, assets) {
  let result = source
  for (const asset of assets) {
    const escapedAsset = escapeAttr(asset)
    result = result.replaceAll(
      new RegExp(`<script\\b(?![^>]*\\bcrossorigin=)([^>]*\\bsrc="${escapeRegExp(escapedAsset)}"[^>]*)>`, 'g'),
      '<script$1 crossorigin="anonymous">'
    )
  }
  return result
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
