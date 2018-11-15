import React from 'react'
import ReactDOM from 'react-dom'
import './styles.css'
import { hot } from '../../../../react-hot-loader'

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

const HApp = hot(module)(App)

ReactDOM.render(<HApp />, document.querySelector('#root'))

// if (module.hot) {
//   module.hot.accept()
// }
