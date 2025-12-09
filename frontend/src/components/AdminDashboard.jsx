import React, { useEffect, useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import BugList from './BugList';
import TeamList from './TeamList';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function DraggableBug({ bug }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: bug._id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="bug-card">
      {bug.title}
    </div>
  );
}

function DroppableTeam({ team, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: team.teamName,
  });

  const style = {
    border: isOver ? "2px dashed #007bff" : "2px solid #ccc",
    padding: "10px",
    minHeight: "100px",
    marginBottom: "20px",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <h3>{team.teamName}</h3>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
    const [bugs, setBugs] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [department, setDepartment] = useState("");
    const [description, setDescription] = useState("");
    const [teamleader, setTeamleader] = useState("");
    const [newDeveloperEmail, setNewDeveloperEmail] = useState("");
    const [developerList, setDeveloperList] = useState([]);

    const handleDragEnd = (event) => {
      const { over, active } = event;
      if (over) {
        console.log(`Bug ${active.id} dropped on team ${over.id}`);
        // TODO: API call zum Zuordnen des Bugs an das Team
      }
    };

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

    const fetchTeams = async () => {
      try {
          const response = await fetch(`${API_URL}/api/teams`);
          const result = await response.json();

          if (result.success) {
              setTeams(result.data);
          }
      } catch (err) {
          console.error("Error fetching teams:", err);
      }
    };

    useEffect(() => {
        fetchBugs();
    }, []);

    useEffect(() => {
        fetchTeams();
    }, []);

    const addDeveloper = () => {
        if (!newDeveloperEmail.trim()) return;

        setDeveloperList(prev => [...prev, newDeveloperEmail]);
        setNewDeveloperEmail("");
    };

    const removeDeveloper = (email) => {
        setDeveloperList(prev => prev.filter(dev => dev !== email));
    };

    const createTeam = async () => {
      try {
          const tokenRes = await fetch(`${API_URL}/api/csrf-token`, {
            method: "GET",
            credentials: "include",
          });
          const { csrfToken } = await tokenRes.json();

          const response = await fetch(`${API_URL}/api/teams`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken
              },
              credentials: "include",  
              body: JSON.stringify({
                  teamName,
                  department,
                  description,
                  teamleader,
                  developers: developerList
              })
          });

          const result = await response.json();

          if (result.success) {
              alert("Team created successfully!");
              await fetchTeams();
              setShowCreateTeamModal(false);
          } else {
              alert("Error creating team : " + result.message);
          }
      } catch (err) {
          console.error("Error creating team:", err);
          alert("Unable to connect to the server");
      }
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
                <input placeholder="Teamname" value={teamName} onChange={e => setTeamName(e.target.value)} />
                <input placeholder="Department" value={department} onChange={e => setDepartment(e.target.value)} />
                <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <input placeholder="Team-Leader (email)" value={teamleader} onChange={e => setTeamleader(e.target.value)} />
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
                    <button onClick={createTeam}>Create</button>
                    <button onClick={() => setShowCreateTeamModal(false)}>Cancel</button>
                </div>
            </div>
        </div>
      ) : (
        <TeamList teams={teams}/>
      )}
      </section>
    </div>
  );
}
