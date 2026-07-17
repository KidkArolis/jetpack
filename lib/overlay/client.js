import { parseStack } from './stack.js'

const OVERLAY_ID = 'jetpack-error-overlay'
const JETPACK_VERSION =
  typeof __JETPACK_OVERLAY_JETPACK_VERSION__ === 'string' ? __JETPACK_OVERLAY_JETPACK_VERSION__ : ''
const RSPACK_VERSION = typeof __JETPACK_OVERLAY_RSPACK_VERSION__ === 'string' ? __JETPACK_OVERLAY_RSPACK_VERSION__ : ''
let currentError = null
let currentErrors = []
let currentErrorIndex = 0
let lastErrorSignature = ''
let pendingRuntimeError = null
let showIgnoredFrames = false
let buildEvents = null

install()

function install() {
  if (typeof window === 'undefined' || window.__JETPACK_ERROR_OVERLAY_INSTALLED__) return
  window.__JETPACK_ERROR_OVERLAY_INSTALLED__ = true
  window.__JETPACK_ERROR_OVERLAY__ = {
    show: showRuntimeError,
    installed: true
  }

  window.addEventListener('error', handleErrorEvent, true)
  window.addEventListener('unhandledrejection', handleUnhandledRejection, true)
  connectBuildEvents()
}

function handleErrorEvent(event) {
  if (event.error) {
    showRuntimeError(event.error, event.filename, event.lineno, event.colno)
    return
  }

  const fallback = errorFromMessage(event.message, event.filename, event.lineno, event.colno)
  if (fallback) {
    showRuntimeError(fallback, event.filename, event.lineno, event.colno)
  }
}

function handleUnhandledRejection(event) {
  const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
  showRuntimeError(reason)
}

function errorFromMessage(message, source, lineno, colno) {
  if (!message || !source || !lineno || String(message) === 'Script error.') return null

  const fallback = new Error(String(message))
  fallback.stack = `${fallback.name}: ${fallback.message}\n    at ${source}:${lineno}:${colno || 1}`
  return fallback
}

function showRuntimeError(error, filename, lineno, colno) {
  const frames = parseStack(error.stack)
  if (filename && lineno && !frames.some((frame) => frame.url === filename && frame.line === lineno)) {
    frames.unshift({
      methodName: error.name || '<anonymous>',
      url: filename,
      line: lineno,
      column: colno || 1
    })
  }

  const runtimeError = {
    type: 'runtime',
    name: error.name || 'Error',
    message: error.message || String(error),
    stack: error.stack || '',
    frames
  }

  const signature = `${runtimeError.name}:${runtimeError.message}:${runtimeError.stack}`
  if (signature && signature === lastErrorSignature) return
  lastErrorSignature = signature

  if (currentError?.type === 'build') return

  if (isBundlerMissingModuleError(runtimeError)) {
    clearPendingRuntimeError()
    pendingRuntimeError = setTimeout(() => {
      pendingRuntimeError = null
      showResolvedRuntimeError(runtimeError)
    }, 300)
    return
  }

  showResolvedRuntimeError(runtimeError)
}

function showResolvedRuntimeError(runtimeError) {
  setCurrentErrors([runtimeError])
  const requestedError = currentError

  render({
    ...requestedError,
    loading: true
  })

  fetchFrameData(requestedError).then(
    (data) => {
      if (currentError !== requestedError) return
      setCurrentErrors([data])
      render(currentError)
    },
    () => {
      if (currentError === requestedError) render(currentError)
    }
  )
}

async function fetchFrameData(error) {
  const endpoint = endpointFromFrames(error.frames)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(error)
  })

  if (!response.ok) throw new Error(`Jetpack overlay request failed: ${response.status}`)
  return response.json()
}

function connectBuildEvents() {
  if (typeof EventSource === 'undefined') return

  const endpoint = new URL('/__jetpack/overlay-events', document.currentScript?.src || window.location.href).toString()
  buildEvents = new EventSource(endpoint)
  window.addEventListener('pagehide', closeBuildEvents)
  window.addEventListener('beforeunload', closeBuildEvents)

  buildEvents.addEventListener('message', (event) => {
    let payload
    try {
      payload = JSON.parse(event.data)
    } catch {
      return
    }

    if (payload.type === 'build-ok') {
      clearPendingRuntimeError()
      if (currentError?.type === 'build') hide()
      return
    }

    if (payload.type === 'build-error') {
      clearPendingRuntimeError()
      const buildErrors = Array.isArray(payload.errors) && payload.errors.length ? payload.errors : [payload]
      setCurrentErrors(buildErrors.map(normalizeBuildError))
      render(currentError)
    }
  })
}

function closeBuildEvents() {
  if (!buildEvents) return
  buildEvents.close()
  buildEvents = null
}

function normalizeBuildError(error) {
  return {
    type: 'build',
    label: error.label || 'Build Error',
    name: error.name || 'Build Error',
    message: error.message || 'Build failed',
    stack: error.stack || '',
    frames: error.frames || [],
    codeFrame: error.codeFrame || null
  }
}

function setCurrentErrors(errors, index = 0) {
  currentErrors = errors
  currentErrorIndex = Math.min(Math.max(index, 0), Math.max(0, errors.length - 1))
  currentError = currentErrors[currentErrorIndex] || null
}

function clearPendingRuntimeError() {
  if (!pendingRuntimeError) return
  clearTimeout(pendingRuntimeError)
  pendingRuntimeError = null
}

function endpointFromFrames(frames) {
  const firstUrl = frames.find((frame) => frame.url)?.url
  return new URL('/__jetpack/error-frame', firstUrl || window.location.href).toString()
}

function render(error) {
  if (!error) return
  ensureStyle()

  let root = document.getElementById(OVERLAY_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = OVERLAY_ID
    document.documentElement.appendChild(root)
  }

  const primary = error.primaryFrame || error.frames?.find((frame) => frame.source && !frame.ignored)
  const frames = error.frames || []
  const visibleFrames = frames.filter((frame) => !isIgnoredFrame(frame)).slice(0, 8)
  const ignoredFrames = frames.filter((frame) => isIgnoredFrame(frame))

  root.innerHTML = `
    <div class="jpo-backdrop"></div>
    <section class="jpo-dialog" role="dialog" aria-modal="true" aria-labelledby="jpo-title">
      <header class="jpo-nav">
        <div class="jpo-lip jpo-lip-left">
          ${renderPagination()}
        </div>
        <div class="jpo-lip jpo-lip-right">
          <div class="jpo-brand">
            <span>Jetpack${JETPACK_VERSION ? ` ${escapeHtml(JETPACK_VERSION)}` : ''}</span>
            <span class="jpo-brand-rspack">Rspack${RSPACK_VERSION ? ` ${escapeHtml(RSPACK_VERSION)}` : ''}</span>
          </div>
          <button type="button" class="jpo-close-icon" data-jpo-close aria-label="Close">
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
              <path d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z" fill="currentColor"></path>
            </svg>
          </button>
        </div>
      </header>

      <div class="jpo-toolbar">
        <span class="jpo-label">${escapeHtml(error.label || 'Runtime Error')}</span>
        ${renderCopyButton()}
      </div>

      <main class="jpo-body">
        <h1 id="jpo-title">${escapeHtml(error.message || error.name || 'Runtime error')}</h1>
        ${error.loading ? '<p class="jpo-muted">Resolving original source...</p>' : ''}
        ${renderCodeFrame(error.codeFrame)}
        ${renderCallStack(visibleFrames, ignoredFrames, frames.length)}
        ${!error.loading && !error.codeFrame && !primary && !visibleFrames.length ? renderRawStack(error.stack) : ''}
      </main>
    </section>
  `

  root.querySelector('.jpo-backdrop')?.addEventListener('click', hide)
  root.querySelector('[data-jpo-close]')?.addEventListener('click', hide)
  root.querySelector('[data-jpo-copy]')?.addEventListener('click', copyCurrentError)
  root.querySelector('[data-jpo-toggle-ignored]')?.addEventListener('click', toggleIgnoredFrames)
  root.querySelector('[data-jpo-prev]')?.addEventListener('click', () => selectError(currentErrorIndex - 1))
  root.querySelector('[data-jpo-next]')?.addEventListener('click', () => selectError(currentErrorIndex + 1))
}

function hide() {
  document.getElementById(OVERLAY_ID)?.remove()
  currentErrors = []
  currentErrorIndex = 0
  currentError = null
  lastErrorSignature = ''
}

function renderPagination() {
  const total = currentErrors.length || 1
  const current = currentErrorIndex + 1

  return `
    <nav class="jpo-pagination" aria-label="Errors">
      <button type="button" data-jpo-prev ${current === 1 ? 'disabled' : ''} aria-label="Previous error">‹</button>
      <span>${current}/${total}</span>
      <button type="button" data-jpo-next ${current === total ? 'disabled' : ''} aria-label="Next error">›</button>
    </nav>
  `
}

function selectError(index) {
  if (!currentErrors.length || index < 0 || index >= currentErrors.length) return
  showIgnoredFrames = false
  setCurrentErrors(currentErrors, index)
  render(currentError)
}

function toggleIgnoredFrames() {
  showIgnoredFrames = !showIgnoredFrames
  render(currentError)
}

async function copyCurrentError() {
  if (!currentError || !navigator.clipboard) return
  await navigator.clipboard.writeText(`${currentError.name}: ${currentError.message}\n${currentError.stack || ''}`)
  showCopiedState()
}

function showCopiedState() {
  const button = document.querySelector(`#${OVERLAY_ID} [data-jpo-copy]`)
  if (!button) return

  button.classList.add('jpo-icon-button-copied')
  button.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>
  `

  setTimeout(() => {
    if (!button.isConnected) return
    button.classList.remove('jpo-icon-button-copied')
    button.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
      </svg>
    `
  }, 1100)
}

function renderCodeFrame(codeFrame) {
  if (!codeFrame) return ''

  return `
    <section class="jpo-code-card">
      <div class="jpo-code-header">
        <span class="jpo-file">${escapeHtml(formatFrameLocation(codeFrame))}</span>
      </div>
      <pre class="jpo-code"><code>${codeFrame.lines.map((line) => renderCodeLine(line, codeFrame.column)).join('')}</code></pre>
    </section>
  `
}

function renderCopyButton() {
  return `
    <button type="button" class="jpo-icon-button" data-jpo-copy title="Copy error details" aria-label="Copy error details">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
      </svg>
    </button>
  `
}

function renderCodeLine(line, column) {
  const marker = line.highlight ? '>' : ' '
  const lineNumber = String(line.number).padStart(4, ' ')
  const pointer =
    line.highlight && column
      ? `<span class="jpo-code-pointer-line"><span class="jpo-marker"> </span><span class="jpo-gutter">     |</span> ${' '.repeat(Math.max(0, column - 1))}<span class="jpo-pointer">^</span></span>`
      : ''

  return `<span class="${line.highlight ? 'jpo-code-line jpo-code-line-active' : 'jpo-code-line'}"><span class="jpo-marker">${marker}</span><span class="jpo-gutter">${lineNumber} |</span> ${highlightCode(line.value)}</span>${pointer}`
}

function renderCallStack(frames, ignoredFrames, totalCount) {
  const ignoredCount = ignoredFrames.length
  if (!frames.length && !ignoredCount) return ''
  const renderedFrames = showIgnoredFrames
    ? frames.concat(ignoredFrames.map((frame) => ({ ...frame, ignored: true })))
    : frames

  return `
    <section class="jpo-stack">
      <div class="jpo-stack-header">
        <h2>Call Stack <span>${totalCount}</span></h2>
        ${ignoredCount ? renderIgnoredFramesToggle(ignoredCount) : ''}
      </div>
      ${renderedFrames
        .map(
          (frame) => `
            <div class="${frame.ignored ? 'jpo-stack-frame jpo-stack-frame-ignored' : 'jpo-stack-frame'}">
              <strong>${escapeHtml(frame.methodName || '<anonymous>')}</strong>
              <span>${escapeHtml(formatFrameLocation(frame.source || frame.generated || frame))}</span>
            </div>
          `
        )
        .join('')}
    </section>
  `
}

function renderIgnoredFramesToggle(ignoredCount) {
  const label = `${showIgnoredFrames ? 'Hide' : 'Show'} ${ignoredCount} ignore-listed frame${ignoredCount === 1 ? '' : '(s)'}`
  return `
    <button type="button" class="jpo-stack-toggle" data-jpo-toggle-ignored aria-expanded="${showIgnoredFrames}">
      ${escapeHtml(label)}
      <svg aria-hidden="true" viewBox="0 0 16 16" width="15" height="15" fill="none">
        <path d="M5 6.5 8 3.5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M5 9.5 8 12.5l3-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </button>
  `
}

function renderRawStack(stack) {
  if (!stack) return ''
  return `<pre class="jpo-raw-stack">${escapeHtml(stack)}</pre>`
}

function isIgnoredFrame(frame) {
  if (frame.ignored) return true

  const source = frame.source || frame.generated || frame
  const method = frame.methodName || ''
  const location = `${source.file || ''} ${source.url || ''} ${method}`.replaceAll('\\', '/')

  return (
    /\b(__webpack_require__|__webpack_exports__|webpackJsonpCallback|hot_module_replacement|webpack\/runtime)\b/.test(
      location
    ) ||
    /^<anonymous>$/.test(method) ||
    (/\/assets\/bundle(?:\.[\w-]+)?\.js\b/.test(location) && !looksLikeSourcePath(method))
  )
}

function isBundlerMissingModuleError(error) {
  if (!/Cannot find module /.test(error.message || '')) return false

  return (error.frames || []).some((frame) => {
    const location = `${frame.methodName || ''} ${frame.url || ''}`.replaceAll('\\', '/')
    return /__rspack_missing_module|webpack\/missing|\/assets\/bundle(?:\.[\w-]+)?\.js\b/.test(location)
  })
}

function looksLikeSourcePath(value) {
  return /^(\.\/)?(src|app|pages|components|lib)\//.test(value || '')
}

function formatFrameLocation(frame) {
  if (!frame) return 'unknown'
  const file = frame.file || frame.url || ''
  const line = frame.line ? ` (${frame.line}${frame.column ? `:${frame.column}` : ''})` : ''
  const method = frame.methodName ? ` @ ${frame.methodName}` : ''
  return `${file}${line}${method}`
}

function highlightCode(value) {
  return escapeHtml(value)
    .replace(
      /\b(import|export|default|function|const|let|var|return|throw|new|if|else|typeof|class|extends|from|async|await)\b/g,
      '<span class="jpo-token-keyword">$1</span>'
    )
    .replace(/(&quot;[^&]*?&quot;|'[^']*?')/g, '<span class="jpo-token-string">$1</span>')
    .replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span class="jpo-token-type">$1</span>')
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function ensureStyle() {
  if (document.getElementById(`${OVERLAY_ID}-style`)) return

  const style = document.createElement('style')
  style.id = `${OVERLAY_ID}-style`
  style.textContent = `
    #${OVERLAY_ID}, #${OVERLAY_ID} * {
      box-sizing: border-box;
    }

    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      color: #1d232b;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }

    #${OVERLAY_ID} .jpo-dialog,
    #${OVERLAY_ID} .jpo-dialog button,
    #${OVERLAY_ID} .jpo-dialog h1,
    #${OVERLAY_ID} .jpo-dialog h2,
    #${OVERLAY_ID} .jpo-dialog p,
    #${OVERLAY_ID} .jpo-counter,
    #${OVERLAY_ID} .jpo-pagination,
    #${OVERLAY_ID} .jpo-brand,
    #${OVERLAY_ID} .jpo-actions {
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      letter-spacing: 0 !important;
    }

    #${OVERLAY_ID} .jpo-dialog .jpo-code,
    #${OVERLAY_ID} .jpo-dialog .jpo-code code,
    #${OVERLAY_ID} .jpo-dialog .jpo-code span,
    #${OVERLAY_ID} .jpo-dialog .jpo-code-header,
    #${OVERLAY_ID} .jpo-dialog .jpo-code-header span {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
      font-variant-ligatures: none !important;
      font-feature-settings: "liga" 0, "calt" 0 !important;
    }

    #${OVERLAY_ID} .jpo-code,
    #${OVERLAY_ID} .jpo-code *,
    #${OVERLAY_ID} .jpo-code-header,
    #${OVERLAY_ID} .jpo-code-header *,
    #${OVERLAY_ID} .jpo-label,
    #${OVERLAY_ID} .jpo-stack-frame strong {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
      font-variant-ligatures: none !important;
      font-feature-settings: "liga" 0, "calt" 0 !important;
    }

    .jpo-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(248, 249, 251, 0.76);
      backdrop-filter: blur(1.5px);
    }

    .jpo-dialog {
      --jpo-red: #c94449;
      --jpo-border: #e6e8eb;
      --jpo-muted: #6f7782;
      --jpo-code-bg: #fbfbfc;
      position: absolute;
      top: min(10vh, 76px);
      left: 50%;
      transform: translateX(-50%);
      width: min(1120px, calc(100vw - 64px));
      max-height: calc(100vh - 72px);
      overflow: hidden;
      border: 1px solid var(--jpo-border);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 22px 70px rgba(20, 26, 38, 0.14);
    }

    .jpo-nav,
    .jpo-toolbar,
    .jpo-body {
      padding-left: 20px;
      padding-right: 20px;
    }

    .jpo-nav {
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f0f1f3;
      background: #fff;
      color: var(--jpo-muted);
      font-size: 12px;
      font-weight: 600;
      position: relative;
      padding-left: 20px;
      padding-right: 20px;
    }

    .jpo-lip {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 1;
    }

    .jpo-pagination,
    .jpo-brand,
    .jpo-close-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 28px;
      padding: 0 10px;
      border: 1px solid #edf0f2;
      border-radius: 999px;
      background: #fbfcfd;
      box-shadow: 0 1px 2px rgba(20, 26, 38, 0.04);
    }

    .jpo-pagination {
      height: 34px;
      padding: 4px;
      gap: 8px;
      background: #fff;
    }

    .jpo-pagination button {
      width: 26px;
      height: 26px;
      border: 0;
      border-radius: 999px;
      background: #f0f1f3;
      color: #747b86;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 20px;
      line-height: 1;
      font-weight: 300;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 0 2px;
    }

    .jpo-pagination button:disabled {
      color: #c5cad0;
      cursor: default;
      opacity: 0.72;
    }

    .jpo-pagination span {
      min-width: 24px;
      text-align: center;
      color: #68707b;
      font-size: 12px;
      font-weight: 500;
    }

    .jpo-brand {
      font-weight: 500;
    }

    .jpo-brand-rspack {
      color: #9a3d43;
      font-weight: 500;
      background: var(--rs-hero-title-gradient, linear-gradient(279deg, #ff8b00 35.21%, #f93920 63.34%));
      -webkit-text-fill-color: transparent;
      -webkit-background-clip: text;
      background-clip: text;
    }

    .jpo-close-icon {
      width: 28px;
      padding: 0;
      color: #6b7280;
      cursor: pointer;
    }

    .jpo-close-icon:hover {
      color: #303640;
      background: #fff;
    }

    .jpo-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
    }

    .jpo-label {
      display: inline-flex;
      padding: 5px 8px;
      border-radius: 7px;
      background: #fff0f0;
      color: var(--jpo-red);
      font-size: 11px !important;
      line-height: 1.15;
      font-weight: 650;
    }

    .jpo-actions {
      display: flex;
      gap: 8px;
    }

    .jpo-icon-button {
      border: 1px solid #e5e7eb;
      border-radius: 7px;
      background: #fff;
      color: #59616d;
      width: 32px;
      height: 32px;
      padding: 0;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(20, 26, 38, 0.04);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 120ms ease, box-shadow 120ms ease, color 120ms ease, background 120ms ease, border-color 120ms ease;
    }

    .jpo-icon-button:hover {
      color: #303640;
      border-color: #d7dbe0;
      background: #fbfcfd;
    }

    .jpo-icon-button:active {
      transform: scale(0.94);
      box-shadow: inset 0 1px 2px rgba(20, 26, 38, 0.12);
    }

    .jpo-icon-button-copied,
    .jpo-icon-button-copied:hover {
      color: #2f9e61;
      border-color: rgba(47, 158, 97, 0.28);
      background: rgba(47, 158, 97, 0.08);
      transform: scale(1.04);
    }

    .jpo-body {
      overflow: auto;
      max-height: calc(100vh - 150px);
      padding-top: 16px;
      padding-bottom: 22px;
    }

    .jpo-body h1 {
      margin: 0 0 20px;
      color: var(--jpo-red);
      font-size: 16px !important;
      line-height: 1.32 !important;
      font-weight: 500 !important;
    }

    .jpo-muted {
      margin: -12px 0 18px;
      color: var(--jpo-muted);
      font-size: 12px;
    }

    .jpo-code-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background: var(--jpo-code-bg);
    }

    .jpo-code-header {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-height: 40px;
      padding: 0 14px;
      border-bottom: 1px solid #e9ebee;
      background: #fff;
      color: #2b3139;
      font-size: 12px !important;
      line-height: 1.4 !important;
      font-weight: 500;
    }

    .jpo-file {
      overflow-wrap: anywhere;
    }

    .jpo-code,
    .jpo-raw-stack {
      margin: 0;
      padding: 14px 0;
      overflow: auto;
      color: #20262e;
      font-size: 11px !important;
      line-height: 1.5 !important;
      font-weight: 500;
      tab-size: 2;
    }

    .jpo-code-line {
      display: block;
      min-width: max-content;
      padding-right: 24px;
      white-space: pre;
      font: inherit !important;
    }

    .jpo-code-pointer-line {
      display: block;
      min-width: max-content;
      padding-right: 24px;
      white-space: pre;
      font: inherit !important;
    }

    .jpo-code-line-active {
      background: rgba(213, 65, 69, 0.08);
    }

    .jpo-marker {
      display: inline-block;
      width: 22px;
      padding-left: 8px;
      color: #ff5b5f;
      font-weight: 800;
    }

    .jpo-gutter {
      color: #858b95;
      user-select: none;
    }

    .jpo-pointer {
      color: #ff5b5f;
      font-weight: 900;
    }

    .jpo-token-keyword {
      color: #b73972;
    }

    .jpo-token-string {
      color: #2d7c70;
    }

    .jpo-token-type {
      color: #2e6ecb;
    }

    .jpo-stack {
      margin-top: 22px;
    }

    .jpo-stack-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: baseline;
      margin-bottom: 9px;
    }

    .jpo-stack h2 {
      margin: 0;
      font-size: 16px !important;
      line-height: 1.3 !important;
      font-weight: 560 !important;
      color: #20262e;
    }

    .jpo-stack h2 span {
      display: inline-flex;
      min-width: 22px;
      height: 22px;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #f0f1f3;
      color: var(--jpo-muted);
      font-size: 11px !important;
      margin-left: 6px;
    }

    .jpo-stack-header p {
      margin: 0;
      color: var(--jpo-muted);
      font-size: 12px !important;
    }

    .jpo-stack-toggle {
      border: 0;
      background: transparent;
      color: var(--jpo-muted);
      font-size: 12px !important;
      line-height: 1.3 !important;
      font-weight: 400 !important;
      padding: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .jpo-stack-toggle:hover {
      color: #303640;
    }

    .jpo-stack-toggle svg {
      flex: 0 0 auto;
    }

    .jpo-stack-frame {
      padding: 10px 0;
      border-top: 1px solid #eff1f3;
    }

    .jpo-stack-frame-ignored {
      opacity: 0.68;
    }

    .jpo-stack-frame strong,
    .jpo-stack-frame span {
      display: block;
    }

    .jpo-stack-frame strong {
      margin-bottom: 4px;
      color: #222831;
      font-size: 12px !important;
      line-height: 1.35 !important;
      font-weight: 560;
    }

    .jpo-stack-frame span {
      color: var(--jpo-muted);
      font-size: 12px !important;
      overflow-wrap: anywhere;
    }

    .jpo-raw-stack {
      margin-top: 18px;
      padding: 14px;
      border-radius: 8px;
      background: #111;
      color: #e9eef2;
      white-space: pre-wrap;
    }

    @media (max-width: 720px) {
      .jpo-dialog {
        top: 12px;
        width: calc(100vw - 24px);
        max-height: calc(100vh - 24px);
      }

      .jpo-body {
        max-height: calc(100vh - 144px);
      }

      .jpo-body h1 {
        font-size: 15px !important;
      }
    }
  `
  document.head.appendChild(style)
}
