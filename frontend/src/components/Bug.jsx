import React from 'react'
import './Bug.css'

function Bug({ bug, onDelete, onDeletePointerDown }) {

  const getSeverityClass = (severity) => {
    return `severity-badge severity-${severity}`
  }

  return (
    <div key={bug._id || bug.id} className="bug-card">
      <div className="bug-header">
        <h3>{bug.title}</h3>
        <span className={getSeverityClass(bug.severity)}>
          {bug.severity.toUpperCase()}
        </span>
      </div>

      <div className="bug-details">
        <p>
          <strong>Company:</strong> {bug.companyName}
        </p>
        <p>
          <strong>Description:</strong> {bug.description}
        </p>
        <p>
          <strong>Reporter:</strong> {bug.reporterEmail}
        </p>
        {bug.bountyAmount && (
          <p><strong>Bounty:</strong> €{bug.bountyAmount}</p>
        )}
        <p>
          <strong>Status:</strong>{" "}
          <span className="status-badge">{bug.status}</span>
        </p>
        <div className="bug-last-row">
          <p className="timestamp">
            <strong>Submitted:</strong>{" "}
            {new Date(bug.submittedAt).toLocaleString()}
          </p>
          {onDelete && (
            <button 
                onClick={(e) => {
                  onDelete(bug);
                }}
                onPointerDown={onDeletePointerDown}
              >Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bug
