const styles = require('./styles.css')

function main () {
  document.querySelector('#root').innerHTML = `
    <div class=${styles.container}>
      <h1>HMR!</h1>
      <p>Hello world.</p>
      <p>Paragraph two.</p>
    </div>
  `
}

main()

module.hot.accept()
