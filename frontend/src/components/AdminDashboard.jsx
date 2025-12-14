import React, { useEffect, useState } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import Bug from './Bug';
import Team from './Team';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || "https://localhost:3000";

function DraggableBug({ bug, deleteBug}) {
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
      <Bug bug={bug} onDelete={deleteBug}  onDeletePointerDown={(e) => {e.stopPropagation();}} /*prevents drag */ />
    </div>
  );
}

function DroppableTeam({ team, isDragging, setShowTeamBugs, editTeam, deleteTeam}) {
  const { isOver, setNodeRef } = useDroppable({
    id: team._id,
  });

  const style = {
    backgroundColor: isOver ? "#275DAD" : undefined,
  };

  return (
    <div ref={setNodeRef} onClick={() => {if (!isDragging) setShowTeamBugs(team._id);}}>
      <Team team={team} style={style} onEdit={editTeam} onDelete={deleteTeam}/>
    </div>
  );
}

function DroppableUnassigned({ isDragging, setShowTeamBugs}) {
  const { isOver, setNodeRef } = useDroppable({
    id: "unassigned",
  });

  const style = {
    backgroundColor: isOver ? "#275DAD" : undefined,
    textAlign: "center",
  };

  return (
    <div ref={setNodeRef} onClick={() => {if (!isDragging) setShowTeamBugs(null);}}>
      <div className="team-card" style={style}>
        <div className="team-header">
          <h3>Unassigned Bugs</h3>
        </div>
        <div className="team-details">
          <p>Drag bugs here to unassign from teams</p>
        </div>
      </div>
      
    </div>
  );
}

export default function AdminDashboard() {
  const [bugs, setBugs] = useState([]); 
  const [teams, setTeams] = useState([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [teamleader, setTeamleader] = useState("");
  const [newDeveloperEmail, setNewDeveloperEmail] = useState("");
  const [developerList, setDeveloperList] = useState([]);
  const [activeBug, setActiveBug] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTeamBugs, setShowTeamBugs] = useState(null); // null means show unassigned bugs
  const [editingTeam, setEditingTeam] = useState(null);

  // Handle drag end event
  const handleDragEnd = async (event) => {
    const { over, active } = event;
    if (!over) return; // dropped outside any droppable

    const bugId = active.id; 
    const teamId = over.id === "unassigned" ? null: over.id;; // could be null or a team id

    try {
      const tokenRes = await fetch(`${API_URL}/api/csrf-token`, {
        method: "GET",
        credentials: "include",
      });
      const { csrfToken } = await tokenRes.json();

      const res = await fetch(`${API_URL}/api/bugs/${bugId}/assign-team`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ teamId })
      });

      const result = await res.json();
      if (!result.success) {
        console.error(result.message);
        return;
      }
      // update bug list
      setBugs(prev => prev.map(b => b._id === bugId ? result.data : b));

    } catch (err) {
      console.error("Error assigning bug:", err);
    }
  };
  // Fetch bugs from API
  const fetchBugs = async () => {
      try {
      const response = await fetch(`${API_URL}/api/bugs`, {
        credentials: "include"
      });
      const result = await response.json();

      if (result.success)
          setBugs(result.data);
      } catch (err) {
      console.error("Error fetching bugs:", err);
      } finally {
      }
  };

  // Fetch teams from API
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

  // Add developer to the list (modal)
  const addDeveloper = () => {
    if (!newDeveloperEmail.trim()) return;
    if (developerList.includes(newDeveloperEmail)) return;
    setDeveloperList(prev => [...prev, newDeveloperEmail]);
    setNewDeveloperEmail("");
  };

  // Remove developer from the list (modal)
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

  const editTeam = (team) => {
    // set team to edit
    setEditingTeam(team);

    // show modal with team data
    setTeamName(team.teamName);
    setDepartment(team.department);
    setDescription(team.description);
    setTeamleader(team.teamleader);
    setDeveloperList(team.developers || []);
    setShowCreateTeamModal(true);
  };

  const updateTeam = async (teamId, updatedData) => {
    try {
      const tokenRes = await fetch(`${API_URL}/api/csrf-token`, {
        method: "GET",
        credentials: "include",
      });
      const { csrfToken } = await tokenRes.json();

      const res = await fetch(`${API_URL}/api/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify(updatedData)
      });

      const result = await res.json();

      if (result.success) {
        // refresh team list
        setTeams(prev => prev.map(t => t._id === teamId ? result.data : t));
      } else {
        alert("Error updating team: " + result.message);
      }
    } catch (err) {
      console.error("Error updating team:", err);
    }
  };

  const deleteTeam = async (team) => {
    //check if team has assigned bugs
    const assignedBugs = bugs.filter(bug => bug.assignedTeam?.toString() === team._id.toString());
    if (assignedBugs.length > 0) {
      alert(`Cannot delete team "${team.teamName}" because it has assigned bugs. Please unassign or reassign the bugs before deleting the team.`);
      return;
    }

    // show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the team: ${team.teamName}? This action cannot be undone.`)) {
      return;
    }
    try {
      const tokenRes = await fetch(`${API_URL}/api/csrf-token`, {
        method: "GET",
        credentials: "include",
      });
      const { csrfToken } = await tokenRes.json();

      const res = await fetch(`${API_URL}/api/teams/${team._id}`, {
        method: "DELETE",
        headers: {
          "x-csrf-token": csrfToken
        },
        credentials: "include"
      });

      const result = await res.json();

      if (result.success) {
        // refresh team list
        setTeams(prev => prev.filter(t => t._id !== team._id));
      } else {
        console.error(result.message);
      }
    } catch (err) {
      console.error("Error deleting team:", err);
    }
  };

  const deleteBug = async (bug) => {
    // show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the bug: ${bug.title}? This action cannot be undone.`)) {
      return;
    }

    try {
      const tokenRes = await fetch(`${API_URL}/api/csrf-token`, {
        method: "GET",
        credentials: "include",
      });
      const { csrfToken } = await tokenRes.json();

      const res = await fetch(`${API_URL}/api/bugs/${bug._id}`, {
        method: "DELETE",
        headers: {
          "x-csrf-token": csrfToken
        },
        credentials: "include"
      });

      const result = await res.json();

      if (result.success) {
        // refresh bug list
        setBugs(prev => prev.filter(b => b._id !== bug._id));
      } else {
        console.error(result.message);
      }
    } catch (err) {
      console.error("Error deleting bug:", err);
    }
  };

  return (
    <div>
      <div className="admin-dashboard">
        {showCreateTeamModal ? (
          <div className="modal-backdrop">
              <div className="modal">
                  <h3>{editingTeam ? "Edit Team" : "Create New Team"}</h3>
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
                      <button onClick={async () => {
                        if (editingTeam) {
                          await updateTeam(editingTeam._id, {
                            teamName,
                            department,
                            description,
                            teamleader,
                            developers: developerList
                          });
                        } else {
                          await createTeam();
                        }
                          setShowCreateTeamModal(false);
                          setEditingTeam(null);
                          setTeamName("");
                          setDepartment("");
                          setDescription("");
                          setTeamleader("");
                          setDeveloperList([]);
                        }}>Save</button>
                      <button onClick={() => setShowCreateTeamModal(false)}>Cancel</button>
                  </div>
              </div>
          </div>
        ): null}
        <div className="headline">
          <h2>
            {showTeamBugs === null ? "Unassigned Bug Reports" : `Bugs assigned to Team: ${teams.find(t => t._id === showTeamBugs)?.teamName || ""}`}
          </h2>
        </div>
        <div className="headline">
            <h2>Teams</h2>
            <button className="add-button" onClick={() => setShowCreateTeamModal(true)}>+</button>
        </div>
        
        <DndContext
          onDragStart={(event) => {
            const bug = bugs.find(b => b._id === event.active.id);
            setActiveBug(bug);
            setIsDragging(true)
          }}
          onDragEnd={(event) => {
            handleDragEnd(event);
            setActiveBug(null);
            setIsDragging(false);
          }}
          onDragCancel={() => {
            setActiveBug(null);
            setIsDragging(false);
          }}
        >
          <div className="bug-list">
            {bugs
            .filter(bug => {
              if (showTeamBugs === null) {
                return bug.assignedTeam === null;
              }
              return bug.assignedTeam?._id === showTeamBugs;
            })
            .map((bug) => (
              <DraggableBug key={bug._id} bug={bug} deleteBug={deleteBug}/>
            ))}
          </div>

          <div className="team-list">
            {showTeamBugs === null ? null : (<DroppableUnassigned isDragging={isDragging} setShowTeamBugs={setShowTeamBugs}/>)}
            {teams.map((team) => (
              <DroppableTeam key={team._id} team={team} isDragging={isDragging} setShowTeamBugs={setShowTeamBugs} editTeam={editTeam} deleteTeam={deleteTeam}>
              </DroppableTeam>
            ))}
          </div>
          <DragOverlay>
            {activeBug ? <Bug bug={activeBug} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
