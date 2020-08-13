import React, { useState } from 'react'

export default function Counter () {
  const [count, setCount] = useState(0)
  const incrementCount = () => setCount(currentCount => currentCount + 1)
  return <button onClick={incrementCount}>Hooks count is {count}</button>
}
