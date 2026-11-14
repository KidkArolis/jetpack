const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

export function stripAnsi(output) {
  return output.replace(ansiPattern, '')
}
