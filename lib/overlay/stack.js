export function parseStack(stack) {
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
