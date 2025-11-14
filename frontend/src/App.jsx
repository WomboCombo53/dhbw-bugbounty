import React, { useState, useEffect } from "react";
import BugSubmissionForm from "./components/BugSubmissionForm";
import BugList from "./components/BugList";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Load bugs on component mount
  useEffect(() => {
    fetchBugs();
  }, []);

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bug Bounty Tracker</h1>
        <p>Report security vulnerabilities and track bug bounties</p>
      </header>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <main className="App-main">
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

        <section>
          Bugbounty-Tracker v0.2.1 | © Matthias Fauser & Michael Biser
        </section>
      </main>
    </div>
  );
}

export default App;
