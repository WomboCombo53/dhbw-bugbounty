import React, { useEffect, useState } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import Bug from './Bug';
import Team from './Team';
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
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Bug bug={bug} />
    </div>
  );
}

function DroppableTeam({ team, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: team.teamName,
  });

  const style = {
    border: isOver ? "2px dashed #007bff" : "2px solid #ccc",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Team team={team} s/>
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
    const [activeBug, setActiveBug] = useState(null);

    const handleDragEnd = async (event) => {
      const { over, active } = event;
      if (!over) return;

      const bugId = active.id;
      const teamName = over.id;

      try {
        const tokenRes = await fetch(`${API_URL}/api/csrf-token`, {
          method: "GET",
          credentials: "include",
        });
        const { csrfToken } = await tokenRes.json();

        const res = await fetch(`${API_URL}/api/bugs/${bugId}/assign-team`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken
          },
          credentials: "include",
          body: JSON.stringify({ teamName })
        });

        const result = await res.json();
        if (!result.success) {
          console.error(result.message);
          return;
        }
        setBugs(prev => prev.map(b => b._id === bugId ? result.data : b));

      } catch (err) {
        console.error("Error assigning bug:", err);
      }
    };
    // Fetch bugs from API
    const fetchBugs = async () => {
        setLoading(true);
        setError(null);
        try {
        const response = await fetch(`${API_URL}/api/bugs`, {
          credentials: "include"
        });
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
          const response = await fetch(`${API_URL}/api/teams`, {
            credentials: "include"
          });
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
    <div>
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
      ): (
        <div className="admin-dashboard">
          <div className="headline">
              <h2>Unassigned Bug Reports</h2>
          </div>
          <div className="headline">
              <h2>Teams</h2>
              <button className="add-button" onClick={() => setShowCreateTeamModal(true)}>+</button>
          </div>
          
          <DndContext
            onDragStart={(event) => {
              const bug = bugs.find(b => b._id === event.active.id);
              setActiveBug(bug);
            }}
            onDragEnd={(event) => {
              handleDragEnd(event);
              setActiveBug(null);
            }}
            onDragCancel={() => setActiveBug(null)}
          >
            <div className="bug-list">
              {bugs
              .filter(bug => !bug.assignedTeam)
              .map((bug) => (
                <DraggableBug key={bug._id} bug={bug} />
              ))}
            </div>

            <div className="team-list">
              {teams.map((team) => (
                <DroppableTeam key={team.teamName} team={team}>
                  {team.assignedBugs.map((bug) => (
                    <DraggableBug key={bug._id} bug={bug} />
                  ))}
                </DroppableTeam>
              ))}
            </div>
            <DragOverlay>
              {activeBug ? <DraggableBug bug={activeBug} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}
