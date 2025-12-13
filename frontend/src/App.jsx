import React, { useState, useEffect } from "react";
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ReporterDashboard from './components/ReporterDashboard';
import DeveloperDashboard from "./components/DeveloperDashboard";
import "./App.css";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [user, setUser] = useState(null);
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

  function handleLogin(googleUser) {
    setUser(googleUser);
  }

  async function handleLogout() {
    setUser(null);
    google.accounts.id.disableAutoSelect();

    const tokenRes = await fetch(`${API_URL}/api/csrf-token`, {
      method: "GET",
      credentials: "include",
    });
    const { csrfToken } = await tokenRes.json();

    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
    });
  }


  if (checkingSession) return <div>Loading session...</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bug Bounty Tracker</h1>
        {user ? (
          <div className="user-profile">
            <div className="user-info">
              <p>
                Angemeldet als: <strong>{user.name}</strong>
              </p>
              <button className="login-button" onClick={handleLogout}>Logout</button>
            </div>         
            <img
              src={user.picture}
              referrerPolicy="no-referrer"
              alt="Profil"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
            />
          </div>
        ) : (
          <div className="user-profile">
            <p>Nicht eingeloggt</p>
            <img src="https://www.gravatar.com/avatar/?d=mp" style={{ width: "50px", height: "50%", borderRadius: "50%" }} referrerPolicy="no-referrer" alt="Profil"/>
          </div>
        )}
      </header>
      {!user ? (
          <Login onLogin={handleLogin} />
      ) : (
        <main className="App-main">
          <>
            {user && (
              <>
                {user.role === "admin" && (
                  <AdminDashboard/>
                )}

                {user.role === "developer" && (
                  <div>
                    <DeveloperDashboard/>
                  </div>
                )}

                {user.role === "reporter" && (
                  <ReporterDashboard/>
                )}
              </>
            )}
          </>
        </main>
      )}
      <section className="footer">
        Bugbounty-Tracker v0.2.1 | © Matthias Fauser & Michael Biser
      </section>
    </div>
  );
}

export default App;
