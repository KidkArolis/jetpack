import { h, Component, render } from 'preact'

class App extends Component {
  constructor () {
    super()
    this.state = { now: Date.now() }
  }

  update () {
    this.setState({ now: Date.now() })
  }

  render () {
    return (
      <div className='App'>
        <h1 style={{color: '#111'}}>HMR!</h1>
        <img height='132' src='/static/file.png' />
        <p onClick={() => this.update()}>{this.state.now ? this.state.now : 'Loading...'}</p>
      </div>
    )
  }
}

render(<App />, document.body)

if (module.hot) module.hot.accept()
