import test from 'ava'
import { renderHtml, renderHtmlResponse } from '../lib/html.js'

const options = {
  mode: 'development',
  html: {
    title: 'test app',
    cspNonce: false,
    render: null
  }
}

const manifest = {
  js: ['/assets/bundle.js'],
  css: ['/assets/bundle.css'],
  other: [],
  runtime: [],
  inlineRuntime: 'console.log("runtime")'
}

test('renders default html with generated asset tags', (t) => {
  const html = renderHtml(options, manifest)
  t.true(html.includes('<title>test app</title>'))
  t.true(html.includes('<link rel="stylesheet" href="/assets/bundle.css">'))
  t.true(html.includes('<script>\nconsole.log("runtime")\n</script>'))
  t.true(html.includes('<script src="/assets/bundle.js" defer></script>'))
})

test('renders custom html function with pre-rendered tags', (t) => {
  const html = renderHtml(
    {
      ...options,
      html: {
        ...options.html,
        render: ({ html, tags }) => html`<main>${tags.css}${tags.js}</main>`
      }
    },
    manifest
  )

  t.is(
    html,
    '<main><link rel="stylesheet" href="/assets/bundle.css"><script src="/assets/bundle.js" defer></script></main>'
  )
})

test('adds csp nonce placeholders to jetpack-owned scripts', (t) => {
  const html = renderHtml({ ...options, html: { ...options.html, cspNonce: true } }, manifest)
  t.true(html.includes('<script nonce="__JETPACK_CSP_NONCE__">'))
  t.true(html.includes('<script src="/assets/bundle.js" nonce="__JETPACK_CSP_NONCE__" defer></script>'))

  t.true(renderHtmlResponse(html, { cspNonce: 'test-nonce' }).includes('nonce="test-nonce"'))
})

test('adds anonymous crossorigin to dev bundle scripts', (t) => {
  const html = renderHtml({ ...options, command: 'dev' }, manifest)
  t.true(html.includes('<script src="/assets/bundle.js" crossorigin="anonymous" defer></script>'))

  const customHtml = renderHtml(
    {
      ...options,
      command: 'dev',
      html: {
        ...options.html,
        render: '<script src="/assets/bundle.js" defer></script>'
      }
    },
    manifest
  )

  t.is(customHtml, '<script src="/assets/bundle.js" defer crossorigin="anonymous"></script>')
})
