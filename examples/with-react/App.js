import React, { useState } from 'react'
import './App.scss'

function HooksCounter () {
  const [count, setCount] = useState(0)
  const incrementCount = () => setCount(currentCount => currentCount + 1)
  return <button onClick={incrementCount}>Hooks count is {count}</button>
}

class ClassCounter extends React.Component {
  constructor () {
    super();
    this.state = {
      count: 0
    }
  }
  render () {
    const incrementCount = () => this.setState({ count: this.state.count + 1 });
    return <button onClick={incrementCount}>Class count is {this.state.count}</button>
  }
}

function App () {
  return <>
      Component with hooks:
      <HooksCounter />
      <br />
      <br />
      Class component:
      <ClassCounter />
    </>

}

export default App
