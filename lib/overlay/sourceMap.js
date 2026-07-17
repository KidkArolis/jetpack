import path from 'node:path'
import { readFileSync } from 'node:fs'
import { TraceMap, originalPositionFor, sourceContentFor } from '@jridgewell/trace-mapping'

const CODE_CONTEXT = 3

export function createErrorFrameHandler({ compiler, options }) {
  return async function errorFrameHandler(req, res) {
    const payload = req.body || {}
    const frames = Array.isArray(payload.frames) ? payload.frames.slice(0, 40) : parseStack(payload.stack)
    const mappedFrames = frames.map((frame) => symbolicateFrame(frame, { compiler, options, payload }))
    const primaryFrame =
      mappedFrames.find((frame) => frame.source && !frame.ignored) || mappedFrames.find((frame) => frame.source) || null

    res.json({
      name: payload.name || 'Error',
      message: payload.message || '',
      stack: payload.stack || '',
      frames: mappedFrames,
      primaryFrame,
      codeFrame: primaryFrame ? createCodeFrame(primaryFrame) : null
    })
  }
}

function parseStack(stack) {
  if (!stack) return []

  return String(stack)
    .split('\n')
    .map((line) => parseStackLine(line.trim()))
    .filter(Boolean)
}

function parseStackLine(line) {
  let match = line.match(/^at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)$/)
  if (match) {
    return {
      methodName: match[1],
      url: match[2],
      line: Number(match[3]),
      column: Number(match[4])
    }
  }

  match = line.match(/^at\s+(.*?):(\d+):(\d+)$/)
  if (match) {
    return {
      methodName: '<anonymous>',
      url: match[1],
      line: Number(match[2]),
      column: Number(match[3])
    }
  }

  match = line.match(/^(.*?)@(.*?):(\d+):(\d+)$/)
  if (match) {
    return {
      methodName: match[1] || '<anonymous>',
      url: match[2],
      line: Number(match[3]),
      column: Number(match[4])
    }
  }

  return null
}

function symbolicateFrame(frame, { compiler, options, payload }) {
  const fallback = {
    methodName: frame.methodName || '<anonymous>',
    generated: {
      url: frame.url || '',
      line: frame.line || null,
      column: frame.column || null
    },
    source: null,
    ignored: isIgnoredFrame(frame.url || '', frame.methodName)
  }

  if (!frame.url || !frame.line) return fallback

  const map = readSourceMap(frame.url, { compiler, options })
  if (!map) return sourceFrameFromMethodName(frame, fallback, { options, payload })

  const original = originalPositionFor(map, {
    line: frame.line,
    column: Math.max(0, (frame.column || 1) - 1)
  })

  if (!original.source || !original.line) return sourceFrameFromMethodName(frame, fallback, { options, payload })

  const source = normalizeSourcePath(original.source)
  const content = sourceContentFor(map, original.source, true) || readOriginalSource(source, options)

  return {
    methodName: original.name || frame.methodName || '<anonymous>',
    generated: fallback.generated,
    source: {
      file: source,
      line: original.line,
      column: original.column == null ? null : original.column + 1,
      content
    },
    ignored: isIgnoredFrame(source, frame.methodName)
  }
}

function sourceFrameFromMethodName(frame, fallback, { options, payload }) {
  const source = normalizeSourcePath(frame.methodName || '')
  if (!looksLikeAppSource(source)) return fallback

  const content = readOriginalSource(source, options)
  if (!content) return fallback

  return {
    ...fallback,
    source: {
      file: source,
      line: findLikelySourceLine(content, payload),
      column: null,
      content
    },
    ignored: false
  }
}

function findLikelySourceLine(content, payload) {
  const identifier = identifierFromMessage(payload?.message)
  if (identifier) {
    const index = content.split(/\r?\n/).findIndex((line) => line.includes(identifier))
    if (index !== -1) return index + 1
  }

  return 1
}

function identifierFromMessage(message) {
  const text = String(message || '')
  return (
    text.match(/^([A-Za-z_$][\w$]*) is not defined$/)?.[1] ||
    text.match(/^Can't find variable: ([A-Za-z_$][\w$]*)$/)?.[1] ||
    null
  )
}

function readSourceMap(url, { compiler, options }) {
  const assetPath = assetPathFromUrl(url, options)
  if (!assetPath) return null

  const mapPath = `${assetPath}.map`

  try {
    const raw = compiler.outputFileSystem.readFileSync(mapPath, 'utf8')
    return new TraceMap(JSON.parse(raw))
  } catch {
    return null
  }
}

function assetPathFromUrl(url, options) {
  let pathname
  try {
    pathname = new URL(url, 'http://localhost').pathname
  } catch {
    return null
  }

  if (!pathname.startsWith(options.assetBasePathname)) return null

  const relativeAssetPath = pathname.slice(options.assetBasePathname.length)
  if (!relativeAssetPath || relativeAssetPath.includes('\0')) return null

  return path.join(options.dir, options.build.outDir, 'assets', relativeAssetPath)
}

function readOriginalSource(source, options) {
  const file = path.resolve(options.dir, source)
  const relative = path.relative(options.dir, file)

  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return null
  }

  try {
    return readFileSync(file, 'utf8')
  } catch {
    return null
  }
}

function createCodeFrame(frame) {
  const content = frame.source?.content
  if (!content) return null

  const lines = content.split(/\r?\n/)
  const lineNumber = frame.source.line
  const start = Math.max(1, lineNumber - CODE_CONTEXT)
  const end = Math.min(lines.length, lineNumber + CODE_CONTEXT)

  return {
    file: frame.source.file,
    line: lineNumber,
    column: frame.source.column,
    methodName: frame.methodName,
    lines: lines.slice(start - 1, end).map((value, index) => ({
      number: start + index,
      value,
      highlight: start + index === lineNumber
    }))
  }
}

function normalizeSourcePath(source) {
  let normalized = source.replaceAll('\\', '/')
  normalized = normalized.replace(/^webpack:\/\//, '')
  normalized = normalized.replace(/^\/+/, '')
  normalized = normalized.replace(/^\.\//, '')

  const marker = '/./'
  if (normalized.includes(marker)) {
    normalized = normalized.slice(normalized.lastIndexOf(marker) + marker.length)
  }

  return normalized
}

function isIgnoredFrame(value, methodName = '') {
  const normalized = `${methodName || ''} ${value || ''}`.replaceAll('\\', '/')
  return (
    /(^|\/)(node_modules|webpack\/runtime|@rspack|core-js|scheduler|react-dom|react-refresh)\//.test(normalized) ||
    /\b(__webpack_require__|__webpack_exports__|webpackJsonpCallback|hot_module_replacement|webpack\/runtime)\b/.test(
      normalized
    ) ||
    /^<anonymous>$/.test(methodName || '') ||
    /\/assets\/bundle(?:\.[\w-]+)?\.js\b/.test(normalized)
  )
}

function looksLikeAppSource(value) {
  return /^(\.\/)?(src|app|pages|components|lib)\//.test(value) && /\.(jsx?|tsx?|mjs|cjs)$/.test(value)
}
