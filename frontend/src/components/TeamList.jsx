import React from 'react';
import './TeamList.css';
import Team from './Team';

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
        <Team team={team} />
      ))}
    </div>
  );
}

export default TeamList
