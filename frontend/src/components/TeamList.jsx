import React from 'react'
import './TeamList.css'

function TeamList({ teams }) {
  if (teams.length === 0) {
    return (
      <div className="no-teams">
        <p>No teams yet.</p>
      </div>
    )
  }

  return (
    <div className="team-list">
      {teams.map((team) => (
        <div key={team._id || team.id} className="team-card">
          <div className="team-header">
            <h3>{team.title}</h3>
          </div>

          <div className="team-details">
            <p>
              <strong>Department:</strong> {team.department}
            </p>
            <p>
              <strong>Description:</strong> {team.description}
            </p>
            <p>
              <strong>Teamleader:</strong> {team.teamleader}
            </p>
            <p>
              <strong>Number of Developers:</strong> {team.devCount}
            </p>
            <p>
              <strong>Number of assigend Bugs:</strong> {team.devCount}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TeamList
