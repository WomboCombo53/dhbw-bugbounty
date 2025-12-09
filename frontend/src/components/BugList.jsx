import React from 'react';
import './BugList.css';
import Bug from './Bug';

function BugList({ bugs }) {
  if (bugs.length === 0) {
    return (
      <div className="no-bugs">
        <p>No bugs reported yet.</p>
      </div>
    )
  }

  return (
    <div className="bug-list">
      {bugs.map((bug) => (
        <Bug bug={bug} />
      ))}
    </div>
  );
}

export default BugList
