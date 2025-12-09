import React, { useEffect, useState } from "react";
import BugList from './BugList';
import './DeveloperDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function DeveloperDashboard() {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        fetchBugs();
    }, []);

  return (
    <div className="dev-dashboard">
      <section id="bug-list">
        <h2>Bugs</h2>
        <BugList bugs={bugs}/>
      </section>
    </div>
  );
}
