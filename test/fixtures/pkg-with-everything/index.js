import img from './unicorn.png'
import './styles.css'

export default function main () {
  return <div>{img}</div>
}

export function load () {
  require(['./more.js'])
}

setTimeout(() => {
  load()
}, 1000)
