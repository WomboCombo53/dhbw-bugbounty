import React from 'react'
import './BugList.css'

function BugList({ bugs }) {
  if (bugs.length === 0) {
    return (
      <div className="no-bugs">
        <p>No bugs reported yet. Be the first to submit a bug report!</p>
      </div>
    )
  }

  const getSeverityClass = (severity) => {
    return `severity-badge severity-${severity}`
  }

  return (
    <div className="bug-list">
      {bugs.map(bug => (
        <div key={bug.id} className="bug-card">
          <div className="bug-header">
            <h3>{bug.title}</h3>
            <span className={getSeverityClass(bug.severity)}>
              {bug.severity.toUpperCase()}
            </span>
          </div>
          
          <div className="bug-details">
            <p><strong>Company:</strong> {bug.companyName}</p>
            <p><strong>Description:</strong> {bug.description}</p>
            <p><strong>Reporter:</strong> {bug.reporterEmail}</p>
            {bug.bountyAmount && (
              <p><strong>Bounty:</strong> ${bug.bountyAmount}</p>
            )}
            <p><strong>Status:</strong> <span className="status-badge">{bug.status}</span></p>
            <p className="timestamp">
              <strong>Submitted:</strong> {new Date(bug.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default BugList
