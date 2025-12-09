import React from 'react'
import './Team.css'

function Team({ team}) {
  return (
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
  );
}

export default Team
