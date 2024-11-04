require('./styles.css')

function main() {
  document.querySelector('#root').innerHTML = `
    <h1>Testing lightningcss compilation output</h1>
  `
}

main()

module.hot.accept()
