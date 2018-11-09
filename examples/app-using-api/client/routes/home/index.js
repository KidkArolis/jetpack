import { Component, h } from 'preact';
import style from './style';

class Home extends Component {
  constructor () {
    super()
    this.state = {}
  }

  componentDidMount () {
    window.fetch('/api/unicorn')
      .then(res => res.text())
      .then(unicorn => this.setState({ unicorn }))
      .catch(err => {
        console.log('Failed to fetch', err)
      })
  }

  render () {
    const { unicorn } = this.state
	  return (
      <div className={style.home}>
  		  <h1>Home</h1>
  		  <p>This is the Home component.</p>
        <p>{unicorn}</p>
  	  </div>
    )
  }
}

export default Home;
