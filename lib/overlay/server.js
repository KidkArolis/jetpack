import { createRequire } from 'node:module'
import path from 'node:path'
import express from 'express'
import rspack from '@rspack/core'
import { createErrorFrameHandler } from './sourceMap.js'

const require = createRequire(import.meta.url)
const pkg = require('../../package.json')
const rspackPkg = require('@rspack/core/package.json')

export function addJetpackOverlayEntry(rspackConfig) {
  const client = require.resolve('./client.js')
  const reactDOMClient = require.resolve('./reactDomClient.js')
  const normalizedClient = path.normalize(client)
  const normalizedReactDOMClient = path.normalize(reactDOMClient)

  rspackConfig.module.rules[0].oneOf.unshift({
    include: (filepath) => {
      const normalized = path.normalize(filepath)
      return normalized === normalizedClient || normalized === normalizedReactDOMClient
    },
    type: 'javascript/auto'
  })

  const reactDOMPath = rspackConfig.resolve.alias['react-dom']
  if (reactDOMPath) {
    const aliases = { ...rspackConfig.resolve.alias }
    delete aliases['react-dom/client$']
    rspackConfig.resolve.alias = {
      'react-dom/client$': reactDOMClient,
      ...aliases,
      __jetpack_original_react_dom_client__: path.join(reactDOMPath, 'client.js')
    }
  }

  rspackConfig.plugins.push(
    new rspack.DefinePlugin({
      __JETPACK_OVERLAY_JETPACK_VERSION__: JSON.stringify(pkg.version),
      __JETPACK_OVERLAY_RSPACK_VERSION__: JSON.stringify(rspackPkg.version)
    })
  )

  Object.keys(rspackConfig.entry).forEach((name) => {
    rspackConfig.entry[name] = [client].concat(rspackConfig.entry[name])
  })
}

export function addOverlayMiddlewares(middlewares, compiler, options, overlayEvents) {
  middlewares.push({
    name: 'jetpack-error-frame-json',
    path: '/__jetpack/error-frame',
    middleware: express.json({ limit: '256kb' })
  })

  middlewares.push({
    name: 'jetpack-error-frame',
    path: '/__jetpack/error-frame',
    middleware: createErrorFrameHandler({ compiler, options })
  })

  middlewares.push({
    name: 'jetpack-overlay-events',
    path: '/__jetpack/overlay-events',
    middleware: overlayEvents.middleware
  })
}

export function createOverlayEvents(compiler, options) {
  const clients = new Set()
  let lastMessage = null

  compiler.hooks.invalid.tap('jetpack-overlay', () => {
    lastMessage = null
    broadcast({ type: 'build-ok' })
  })

  compiler.hooks.done.tap('jetpack-overlay', (stats) => {
    const errors = stats.toJson({ all: false, errors: true, errorDetails: true }, true).errors || []
    if (!errors.length) {
      lastMessage = { type: 'build-ok' }
      broadcast(lastMessage)
      return
    }

    lastMessage = createBuildErrorMessage(errors, options)
    broadcast(lastMessage)
  })

  function broadcast(message) {
    for (const res of clients) {
      writeEvent(res, message)
    }
  }

  return {
    middleware: (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      })
      res.write('\n')
      clients.add(res)

      if (lastMessage) {
        writeEvent(res, lastMessage)
      }

      req.on('close', () => {
        clients.delete(res)
      })
    }
  }
}

function writeEvent(res, message) {
  res.write(`data: ${JSON.stringify(message)}\n\n`)
}

function createBuildErrorMessage(errors, options) {
  const items = errors.map((error) => createBuildErrorItem(error, options))
  const first = items[0]

  return {
    ...first,
    errors: items
  }
}

function createBuildErrorItem(error, options) {
  const raw = [error.details, error.stack, error.message, String(error)].filter(Boolean).join('\n')
  const file = buildErrorFile(error, raw, options)
  const codeFrame = codeFrameFromBuildError(raw, file)

  return {
    type: 'build-error',
    label: 'Build Error',
    message: buildErrorTitle(raw),
    stack: raw,
    frames: [],
    codeFrame
  }
}

function buildErrorTitle(raw) {
  const lines = String(raw)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const moduleNotFound = lines.find((line) => line.includes("Module not found: Can't resolve"))
  if (moduleNotFound) return moduleNotFound.replace(/^.*Module not found:\s*/, '')
  const syntaxMessage = lines.find((line) =>
    /\b(Expression expected|Syntax Error|Unexpected token|Expected)\b/.test(line)
  )
  if (syntaxMessage) return syntaxMessage.replace(/^[│├╰─▶\s×x]+/, '').trim()
  return lines.find((line) => !line.startsWith('|') && !line.startsWith('>')) || 'Build failed'
}

function codeFrameFromBuildError(raw, file = 'Build error') {
  const lines = String(raw).split('\n')
  const frameLines = []
  const location = String(raw).match(/[╭,][-─]?\[(?:[^\]\n:]+:)?(\d+):(\d+)\]/) || String(raw).match(/\[(\d+):(\d+)\]/)
  let highlightedLine = location ? Number(location[1]) : null
  let pointerColumn = location ? Number(location[2]) + 1 : null

  for (const line of lines) {
    let match = line.match(/^\s*(>?)\s*(\d+)\s*\|\s?(.*)$/)
    if (!match) {
      match = line.match(/^\s*(>?)\s*(\d+)\s*│\s?(.*)$/)
    }
    if (!match) {
      match = line.match(/^[^\d>]*(>?)\s*(\d+)\s*[|│]\s?(.*)$/)
    }
    if (match) {
      const lineNumber = Number(match[2])
      const highlighted = match[1] === '>' || lineNumber === highlightedLine
      frameLines.push({
        number: lineNumber,
        value: match[3],
        highlight: highlighted
      })
      if (highlighted) highlightedLine = lineNumber
      continue
    }

    match = line.match(/^\s*\|\s?(\s*)\^/)
    if (!match) {
      match = line.match(/^\s*·\s?(\s*)[─^]/)
    }
    if (!match) {
      match = line.match(/^[^:|│·]*[:|│·]\s?(\s*)\^/)
    }
    if (match) {
      pointerColumn = match[1].length + 1
    }
  }

  if (!frameLines.length) return null

  return {
    file,
    line: highlightedLine || frameLines[0].number,
    column: pointerColumn,
    methodName: null,
    lines: frameLines
  }
}

function buildErrorFile(error, raw, options) {
  for (const value of [error.moduleName, error.moduleIdentifier, error.moduleId]) {
    const source = normalizeBuildErrorFile(value, options)
    if (source) return source
  }

  for (const line of String(raw).split('\n')) {
    const match = line.match(/(?:ERROR in\s+)?(\.?\/[^\s:]+?\.(?:jsx?|tsx?|mjs|cjs))/)
    if (match) return formatBuildErrorFile(match[1], options)
  }

  return 'Build error'
}

function normalizeBuildErrorFile(value, options) {
  if (!value || typeof value !== 'string') return null
  const withoutLoaders = value.slice(value.lastIndexOf('!') + 1)
  const match = withoutLoaders.match(/(\.?\/[^\s:]+?\.(?:jsx?|tsx?|mjs|cjs))/)
  return match ? formatBuildErrorFile(match[1], options) : null
}

function formatBuildErrorFile(file, options) {
  if (!file || !options?.dir) return file
  if (!path.isAbsolute(file) && !file.startsWith('../') && !file.startsWith('./../')) return file

  const normalizedFile = file.replaceAll('\\', '/')
  const dirName = path.basename(options.dir)
  const dirIndex = normalizedFile.lastIndexOf(`/${dirName}/`)
  if (dirName && dirIndex !== -1) {
    return `./${normalizedFile.slice(dirIndex + dirName.length + 2)}`
  }

  const absoluteFile = path.isAbsolute(file) ? file : path.resolve(options.dir, file)

  const candidateDirs = [options.dir]
  if (options.dir.startsWith('/private/')) {
    candidateDirs.push(options.dir.slice('/private'.length))
  } else {
    candidateDirs.push(`/private${options.dir}`)
  }

  for (const dir of candidateDirs) {
    const relative = path.relative(dir, absoluteFile)
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
      return `./${relative.replaceAll(path.sep, '/')}`
    }
  }

  return file
}
