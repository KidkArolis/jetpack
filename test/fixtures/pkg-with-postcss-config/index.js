require('./styles.css')

function main () {
  document.querySelector('#root').innerHTML = `
    <h1>Extending postcss config</h1>
  `
}

main()

module.hot.accept()
