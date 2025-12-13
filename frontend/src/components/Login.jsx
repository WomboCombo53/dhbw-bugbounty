import React, { useEffect, useState } from "react";
import './Login.css'

export default function Login({ onLogin }) {
  const [user, setUser] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  //Google Button initialisieren
  useEffect(() => {
    if (!window.google) return;

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(
      document.getElementById("googleSignInDiv"),
      {
        theme: "outline",
        size: "large",
        width: "250"
      }
    );
  }, []);

  //Google Login Callback
  function handleCredentialResponse(response) {
    fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential }),
    })
      .then(res => res.json())
      .then(userData => {
        setUser(userData.user); // set backend-user
        if (typeof onLogin === "function") onLogin(userData.user);
      })
      .catch(err => console.error('Google login error:', err));
  }

  return (
    <div className="login-container">
      <div className="login-box">
          <h2>Login</h2>
          <br></br>
          <div id="googleSignInDiv"></div>
      </div>
       
    </div>
  );
}