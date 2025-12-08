import React, { useEffect, useState } from "react";
import BugList from './BugList';
import TeamList from './TeamList';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminDashboard() {
    const [bugs, setBugs] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [newDeveloperEmail, setNewDeveloperEmail] = useState("");
    const [developerList, setDeveloperList] = useState([]);

    // Fetch bugs from API
    const fetchBugs = async () => {
        setLoading(true);
        setError(null);
        try {
        const response = await fetch(`${API_URL}/api/bugs`);
        const result = await response.json();

        if (result.success) {
            setBugs(result.data);
        } else {
            setError("Failed to fetch bug reports");
        }
        } catch (err) {
        console.error("Error fetching bugs:", err);
        setError("Unable to connect to the server");
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchBugs();
    }, []);

    const addDeveloper = () => {
        if (!newDeveloperEmail.trim()) return;

        setDeveloperList(prev => [...prev, newDeveloperEmail]);
        setNewDeveloperEmail("");
    };

    const removeDeveloper = (email) => {
        setDeveloperList(prev => prev.filter(dev => dev !== email));
    };

  return (
    <div className="admin-dashboard">
      <section id="bug-list">
        <h2>Bugs</h2>
        <BugList bugs={bugs}/>
      </section>

      <section id="team-list">
        <div className="headline">
            <h2>Teams</h2>
            <button className="add-button" onClick={() => setShowCreateTeamModal(true)}>+</button>
        </div>
        {showCreateTeamModal ? (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>Create New Team</h3>
                <input placeholder="Teamname"></input>
                <input placeholder="Department" ></input>
                <input placeholder="Description" ></input>
                <input placeholder="Team-Leader (email)" ></input>
                <br></br>
                <div>
                    <input placeholder="Developer (email)" value={newDeveloperEmail} onChange={(e) => setNewDeveloperEmail(e.target.value)}></input>
                    <button className="add-button" onClick={addDeveloper}>+</button>
                </div>
                
                <ul className="developerList">
                    {developerList.map((dev, index) => (
                        <li key={index}>
                            <input value={dev} contentEditable="false"></input>
                            <button className="add-button" onClick={() => removeDeveloper(dev)}>-</button>
                        </li>
                    ))}
                </ul>
                <div className="modal-buttons">
                    <button>Create</button>
                    <button onClick={() => setShowCreateTeamModal(false)}>Cancel</button>
                </div>
            </div>
        </div>
      ) : (
        <TeamList teams={teams}/>
      )}
      </section>

      
    {/*<section>
        <h2>Assign Bug to Team</h2>
        <select onChange={(e) => setSelectedBugId(e.target.value)} value={selectedBugId}>
          <option value="">Select Bug</option>
          {bugs.map(bug => (
            <option key={bug.id} value={bug.id}>{bug.title}</option>
          ))}
        </select>
        <select onChange={(e) => setSelectedTeamId(e.target.value)} value={selectedTeamId}>
          <option value="">Select Team</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <button onClick={handleAssignBug}>Assign Bug</button>
      </section> */}
    </div>
  );
}
