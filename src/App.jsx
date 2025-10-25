import React, { useState } from 'react'
import BugSubmissionForm from './components/BugSubmissionForm'
import BugList from './components/BugList'
import './App.css'

function App() {
  const [bugs, setBugs] = useState([])

  const handleBugSubmit = (bug) => {
    const newBug = {
      ...bug,
      id: Date.now(),
      status: 'open',
      submittedAt: new Date().toISOString()
    }
    setBugs([newBug, ...bugs])
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bug Bounty Tracker</h1>
        <p>Report security vulnerabilities and track bug bounties</p>
      </header>
      
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
    </div>
  )
}

export default App
