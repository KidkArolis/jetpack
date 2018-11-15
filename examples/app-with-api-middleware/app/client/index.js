import React from 'react'
import ReactDOM from 'react-dom'
import './styles.css'

class App extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  componentDidMount () {
    this.update()
  }

  update () {
    window.fetch('./api/data')
      .then(res => res.json())
      .then(data => this.setState(data))
      .catch(err => this.setState({ err }))
  }

  render () {
    const { data } = this.state
    return (
      <div className='App'>
        <h1 style={{ color: '#111' }}>HMR!</h1>
        <img height='132' src='/assets/file.png' />
        <p onClick={() => this.update()}>{data || 'Loading...'}</p>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'))

module.hot.accept()
