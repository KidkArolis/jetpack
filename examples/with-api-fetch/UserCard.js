import React from 'react'

export default function UserCard({ user }) {
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <small>{user.company.name}</small>
    </div>
  )
}
