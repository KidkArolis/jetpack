require('./styles.css')

function main () {
  document.querySelector('#root').innerHTML = `
    <h1>HMR!</h1>
    <p>Hello world.</p>
    <p>Paragraph two.</p>
  `
}

main()

if (module.hot) {
  module.hot.accept()
}
