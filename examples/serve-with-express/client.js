console.log('Hello')
fetch('/api/data').then(res => res.text()).then(data => {
  console.log('Fetched:', data)
  document.querySelector('#root').innerHTML = `Fetched: ${data}`
}).catch(err => {
  console.log(err)
})
