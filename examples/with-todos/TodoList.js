import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos }) {
  if (todos.length === 0) return <p>No todos yet!</p>;
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

export default TodoList;
