import React, { useState } from 'react';
import TodoList from './TodoList';

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim() !== '') {
      setTodos([...todos, { id: Date.now(), text: input }]);
      setInput('');
    }
  };

  return (
    <div className="app">
      <h1>Todo List</h1>
      <div className="todo-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <TodoList todos={todos} />
    </div>
  );
}

export default App;
