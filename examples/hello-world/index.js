import './styles.css'

function main() {
  document.querySelector('#root').innerHTML = `
    <h1>HMR!</h1>
    <p>Hello world.</p>
    <p>Paragraph two.</p>
  `
}

main()

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}
