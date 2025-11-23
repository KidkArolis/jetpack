import './styles.css'

function main () {
  document.querySelector('#root').innerHTML = `
    <h1>HMR!</h1>
    <p>Hello world.</p>
    <p>Paragraph two.</p>
    <button id='load'>Load more</button>
  `

  document.querySelector('#load').addEventListener('click', () => {
    import('./more.js').then(({ more }) => {
      const p = Array.from(document.querySelectorAll('p'))
      p[p.length - 1].appendChild(more())
    })
  })
}

main()

if (module.hot) {
  module.hot.accept()
}
