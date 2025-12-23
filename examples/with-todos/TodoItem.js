import React from 'react';

function TodoItem({ todo }) {
  return <li>{todo.text}</li>;
}

export default TodoItem;
