import React, { useState, useEffect } from "react";
import BugSubmissionForm from "./components/BugSubmissionForm";
import BugList from "./components/BugList";
import Login from './components/Login';
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [bugs, setBugs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  //check session on load 
  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(sessionUser => {
        if (sessionUser.loggedIn){
          setUser(sessionUser.user);
        }else{
          setUser(null);
        }
      })
      .catch(err => console.error("Error checking session:", err))
      .finally(() => setCheckingSession(false));
  }, []);

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

  // Load bugs if user logged in
  useEffect(() => {
    if (user) fetchBugs();
  }, [user]);

  const handleBugSubmit = async (bugData) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/bugs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bugData),
      });

      const result = await response.json();

      if (result.success) {
        // Add new bug to the list
        setBugs([result.data, ...bugs]);
        alert("Bug report submitted successfully!");
      } else {
        setError(result.message || "Failed to submit bug report");
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error("Error submitting bug:", err);
      setError("Unable to submit bug report");
      alert("Error: Unable to submit bug report. Please try again.");
    }
  };

  function handleLogin(googleUser) {
    setUser(googleUser);
  }

  function handleLogout() {
    setUser(null);
    google.accounts.id.disableAutoSelect();
    fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }); // delete session on server side
  }

  if (checkingSession) return <div>Loading session...</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bug Bounty Tracker</h1>
          {user ? (
            <>
              <p>
                Angemeldet als: <strong>{user.name}</strong>
              </p>
              <img
                src={user.picture}
                referrerPolicy="no-referrer"
                alt="Profil"
                style={{ width: "50px", borderRadius: "50%" }}
              />
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <p>Nicht eingeloggt</p>
          )}
      </header>
      {error && <div className="error-banner">⚠️ {error}</div>}
      {!user ? (
          <Login onLogin={handleLogin} />
      ) : (
        <main className="App-main">
          <>
            {user && (
              <>
                {user.role === "admin" && (
                  <div>
                    <h2>Admin Dashboard</h2>
                    {/* Admin-Dashboard */}
                  </div>
                )}

                {user.role === "developer" && (
                  <div>
                    <h2>Developer Dashboard</h2>
                    {/* Developer-Dashboard */}
                  </div>
                )}

                {user.role === "reporter" && (
                  <>
                    <section className="submission-section">
                      <h2>Submit a Bug Report</h2>
                      <BugSubmissionForm onSubmit={handleBugSubmit} />
                    </section>

                    <section className="list-section">
                      <h2>Reported Bugs</h2>
                      {loading ? (
                        <div className="loading">Loading bug reports...</div>
                      ) : (
                        <BugList bugs={bugs} />
                      )}
                    </section>
                  </>
                )}
              </>
            )}
              <section>
                Bugbounty-Tracker v0.2.1 | © Matthias Fauser & Michael Biser
              </section>
          </>
        </main>
      )}
      
    </div>
  );
}

export default App;
