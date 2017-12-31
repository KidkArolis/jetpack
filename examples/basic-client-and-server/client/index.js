import React from 'react'
import ReactDOM from 'react-dom'
import './styles.css'

class App extends React.Component {
  constructor () {
    super()
    this.state = window.DATA
  }

  update () {
    window.fetch('./api/data')
      .then(res => {
        return res.json()
          .then(data => {
            this.setState(data)
          })
      })
      .catch(err => {
        this.setState({ err })
      })
  }

  render () {
    return (
      <div className='App'>
        <h1 style={{color: '#111'}}>HMR!</h1>
        <img height='132' src='/static/file.png' />
        <p onClick={() => this.update()}>{this.state.data ? this.state.data : 'Loading...'}</p>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'))

module.hot.accept()
