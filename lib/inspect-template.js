import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// The package's `exports` map doesn't expose its UMD bundle — resolve the
// entry, then walk up to the package root and read the file directly.
const d3HierarchyEntry = require.resolve('d3-hierarchy')
const d3HierarchyPkg = d3HierarchyEntry.slice(0, d3HierarchyEntry.indexOf('/d3-hierarchy/') + '/d3-hierarchy/'.length)
const d3Hierarchy = readFileSync(path.join(d3HierarchyPkg, 'dist/d3-hierarchy.min.js'), 'utf8')

export default function template({ title, data, totals }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font: 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    header {
      display: flex; gap: 16px; align-items: center;
      padding: 8px 12px; border-bottom: 1px solid #ddd;
      position: sticky; top: 0; background: Canvas; z-index: 10;
    }
    header h1 { font-size: 13px; margin: 0; font-weight: 600; }
    header .crumbs { color: #666; }
    header .crumbs span { cursor: pointer; }
    header .crumbs span:hover { text-decoration: underline; }
    header .sizes { margin-left: auto; display: flex; gap: 4px; }
    header .sizes button {
      font: inherit; padding: 4px 10px; border: 1px solid #ccc;
      background: #f7f7f7; cursor: pointer; border-radius: 4px;
    }
    header .sizes button[aria-pressed='true'] { background: #1f7ae0; color: white; border-color: #1f7ae0; }
    #chart { display: block; width: 100vw; height: calc(100vh - 41px); }
    .node { cursor: pointer; }
    .node rect { stroke: #fff; stroke-width: 1; }
    .node text { pointer-events: none; user-select: none; fill: #111; }
    #tooltip {
      position: fixed; pointer-events: none; background: rgba(20,20,20,.92);
      color: white; padding: 8px 10px; border-radius: 4px; font-size: 12px;
      max-width: 480px; word-break: break-all; line-height: 1.5;
      box-shadow: 0 4px 12px rgba(0,0,0,.3);
    }
    #tooltip strong { font-weight: 600; }
    #tooltip .row { display: flex; justify-content: space-between; gap: 12px; }
    #tooltip .row span:last-child { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <div class="crumbs" id="crumbs"></div>
    <div class="sizes" role="tablist">
      <button data-size="stat" aria-pressed="false">Stat: <strong id="t-stat">${formatBytes(totals.stat)}</strong></button>
      <button data-size="parsed" aria-pressed="true">Parsed: <strong id="t-parsed">${formatBytes(totals.parsed)}</strong></button>
      <button data-size="gzip" aria-pressed="false">Gzip: <strong id="t-gzip">${formatBytes(totals.gzip)}</strong></button>
    </div>
  </header>
  <svg id="chart"></svg>
  <div id="tooltip" hidden></div>
  <script>${d3Hierarchy}</script>
  <script>
${renderScript(data)}
  </script>
</body>
</html>
`
}

function renderScript(data) {
  return `
const data = ${JSON.stringify(data)}
const svg = document.getElementById('chart')
const tooltip = document.getElementById('tooltip')
const crumbs = document.getElementById('crumbs')
let sizeMode = 'parsed'
let zoomStack = [data]

function fmt(n) {
  if (!n) return '0 B'
  const k = 1024, u = ['B','KiB','MiB','GiB']
  const i = Math.min(Math.floor(Math.log(n)/Math.log(k)), u.length - 1)
  return (n / Math.pow(k, i)).toFixed(i ? 2 : 0) + ' ' + u[i]
}

// Stable colour per top-level child (chunk)
const palette = ['#5b8def','#f0b429','#67c587','#e8623f','#a771e6','#15a4b8','#e16ca0','#7d9bb0','#d4a373','#9bc53d']
function colorFor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

function valueOf(node) {
  // For internal nodes the size comes from summing children; for leaves we use the appropriate metric.
  if (node.children?.length) return null
  if (sizeMode === 'parsed') return node.parsedSize ?? node.statSize ?? 0
  if (sizeMode === 'gzip')   return node.gzipSize   ?? node.statSize ?? 0
  return node.statSize ?? 0
}

function render() {
  const root = zoomStack[zoomStack.length - 1]
  const w = window.innerWidth
  const h = window.innerHeight - 41
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h)
  svg.setAttribute('width', w)
  svg.setAttribute('height', h)
  svg.innerHTML = ''

  const hier = d3.hierarchy(root)
    .sum(valueOf)
    .sort((a, b) => b.value - a.value)
  // paddingTop on chunk nodes reserves space for the chunk header so module
  // labels inside don't overlap with it.
  d3.treemap()
    .size([w, h])
    .paddingInner(1)
    .paddingTop((node) => (node.depth === 1 ? 32 : 0))
    .round(true)(hier)

  const renderLeaves = hier.children || []
  for (const node of renderLeaves) {
    drawNode(node, true)
  }

  // Breadcrumbs (hidden at root)
  if (zoomStack.length === 1) {
    crumbs.innerHTML = ''
  } else {
    crumbs.innerHTML = zoomStack
      .map((n, i) =>
        i === zoomStack.length - 1
          ? '<strong>' + escape(n.name) + '</strong>'
          : '<span data-i="' + i + '">' + escape(n.name) + '</span>'
      )
      .join(' / ')
    ;[...crumbs.querySelectorAll('span')].forEach((el) => {
      el.onclick = () => { zoomStack.length = +el.dataset.i + 1; render() }
    })
  }
}

function drawNode(node, topLevel) {
  if (node.x1 - node.x0 < 1 || node.y1 - node.y0 < 1) return
  const g = elem('g', { class: 'node', transform: 'translate(' + node.x0 + ',' + node.y0 + ')' })
  const w = node.x1 - node.x0
  const h = node.y1 - node.y0
  const data = node.data
  const colour = topLevel ? colorFor(data.name) : colorFor(node.parent?.data.name || data.name)
  const rect = elem('rect', { width: w, height: h, fill: colour, 'fill-opacity': topLevel ? 0.55 : 0.85 })
  g.appendChild(rect)

  if (w > 60 && h > 16) {
    const t = elem('text', { x: 4, y: 14, 'font-size': 11, 'font-weight': topLevel ? 600 : 400 })
    t.textContent = clip(data.name, Math.floor(w / 6))
    g.appendChild(t)
  }
  if (topLevel && w > 80 && h > 32) {
    const s = elem('text', { x: 4, y: 28, 'font-size': 10, fill: '#222' })
    s.textContent = fmt(node.value)
    g.appendChild(s)
  }

  g.addEventListener('mousemove', (e) => showTip(e, data, node.value))
  g.addEventListener('mouseleave', () => tooltip.hidden = true)
  g.addEventListener('click', () => {
    if (topLevel && data.children?.length) {
      zoomStack.push(data)
      render()
    }
  })

  if (topLevel && data.children?.length) {
    for (const child of node.children || []) drawNode(child, false)
  }

  svg.appendChild(g)
}

function showTip(e, data, value) {
  const lines = ['<strong>' + escape(data.name) + '</strong>']
  if (data.statSize != null)   lines.push('<div class="row"><span>stat</span><span>'   + fmt(data.statSize)   + '</span></div>')
  if (data.parsedSize != null) lines.push('<div class="row"><span>parsed</span><span>' + fmt(data.parsedSize) + '</span></div>')
  if (data.gzipSize != null)   lines.push('<div class="row"><span>gzip</span><span>'   + fmt(data.gzipSize)   + '</span></div>')
  if (data.children?.length)   lines.push('<div class="row"><span>modules</span><span>' + data.children.length + '</span></div>')
  tooltip.innerHTML = lines.join('')
  tooltip.style.left = Math.min(e.clientX + 12, window.innerWidth - 320) + 'px'
  tooltip.style.top  = Math.min(e.clientY + 12, window.innerHeight - 120) + 'px'
  tooltip.hidden = false
}

function elem(tag, attrs) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  return e
}
function escape(s) { return String(s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'})[c]) }
function clip(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s }

for (const btn of document.querySelectorAll('header .sizes button')) {
  btn.onclick = () => {
    for (const b of document.querySelectorAll('header .sizes button')) b.setAttribute('aria-pressed', 'false')
    btn.setAttribute('aria-pressed', 'true')
    sizeMode = btn.dataset.size
    render()
  }
}
window.addEventListener('resize', render)
render()
`
}

function escapeHtml(s) {
  return String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])
}

function formatBytes(n) {
  if (!n) return '0 B'
  const k = 1024
  const units = ['B', 'KiB', 'MiB', 'GiB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), units.length - 1)
  return (n / Math.pow(k, i)).toFixed(i ? 2 : 0) + ' ' + units[i]
}
