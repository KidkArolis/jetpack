import React, { useState } from 'react'
import { hot } from 'react-hot-loader'

export default function Counter () {
  const [count, setCount] = useState(0)
  const incrementCount = () => setCount(currentCount => currentCount + 1)
  return <button onClick={incrementCount}>Hooks count is {count}</button>
}
