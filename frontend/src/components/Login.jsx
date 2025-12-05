import React, { useEffect, useState } from "react";
import './Login.css'

export default function Login({ onLogin }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!window.google) return;

    google.accounts.id.initialize({
      client_id: "533923725466-j9bdmlol98gt7abptshpnpggdd7i5iuk.apps.googleusercontent.com",
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

  function decodeJwt(token) {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  }

  function handleCredentialResponse(response) {
    const data = decodeJwt(response.credential);
    setUser(data);

    if (typeof onLogin === "function") {
      onLogin(data);
    }
  }

  return (
    <div className="login-container">
        <h2>Login</h2>
        <br></br>
        <div id="googleSignInDiv"></div>
        <a href="anon">Anonym anmelden</a>
    </div>
  );
}