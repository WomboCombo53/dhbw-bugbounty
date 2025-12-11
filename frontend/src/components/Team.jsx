import React from 'react'
import './Team.css'

// Component to display a single Team's information
function Team({ team, style, onEdit, onDelete}) {
  return (
    <div key={team._id || team.id} className="team-card" style={style}>
      <div className="team-header">
        <h3>{team.teamName}</h3>
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
        <div className="team-last-row">
          <p>
          <strong>Number of Developers:</strong> {team.developers.length}
          </p>
          <div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(team);
              }}
            >Edit</button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(team.teamName);
              }}
            >Delete</button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Team
