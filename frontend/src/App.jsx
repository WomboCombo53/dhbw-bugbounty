import React, { useState } from 'react'
import BugSubmissionForm from './components/BugSubmissionForm'
import BugList from './components/BugList'
import Login from './components/Login'
import './App.css'

function App() {
  const [bugs, setBugs] = useState([])
  const [user, setUser] = useState(null);

  const handleBugSubmit = (bug) => {
    const newBug = {
      ...bug,
      id: Date.now(),
      status: 'open',
      submittedAt: new Date().toISOString()
    }
    setBugs([newBug, ...bugs])
  }

  function handleLogin(googleUser) {
    setUser(googleUser);
  }

  function handleLogout() {
    setUser(null);
    google.accounts.id.disableAutoSelect();
  }

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
      
        {!user ? (
            <Login onLogin={handleLogin} />
        ) : (
          <>
            <main className="App-main">
              <section className="submission-section">
                <h2>Submit a Bug Report</h2>
                <BugSubmissionForm onSubmit={handleBugSubmit} />
              </section>

              <section className="list-section">
                <h2>Reported Bugs</h2>
                <BugList bugs={bugs} />
              </section>
            </main>
          </>
        )}
      
    </div>
  );
}

export default App
