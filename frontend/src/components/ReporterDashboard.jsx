import React, { useEffect, useState } from "react";
import BugSubmissionForm from "./BugSubmissionForm";
import BugList from './BugList';

const API_URL = import.meta.env.VITE_API_URL || "https://localhost:3000";

export default function AdminDashboard() {
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

    const handleBugSubmit = async (bugData) => {
        setError(null);
        try {

        const tokenRes = await fetch(`${API_URL}/api/csrf-token`, {
            method: "GET",
            credentials: "include",
        });
        const { csrfToken } = await tokenRes.json();
        const response = await fetch(`${API_URL}/api/bugs`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
            },
            credentials: "include",
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
        <div style={{ display: "grid", gridTemplateColumns: "auto auto" }}>
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
        </div>
    );
}