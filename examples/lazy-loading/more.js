import './more.css'

export function more () {
  const p = document.createElement('p')
  p.className = 'more'
  p.innerText = 'more content'
  return p
}
