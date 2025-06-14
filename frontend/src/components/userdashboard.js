import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [formCode, setFormCode] = useState('');
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "User";

  const handleJoin = (e) => {
    e.preventDefault();
    if (formCode.trim() !== '') {
      navigate(`/form/${formCode}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="fc-dashboard-container">
      <header className="fc-dashboard-header">
        <div className="fc-brand">FormCircle</div>
        <div className="fc-greeting">Hi, {name}</div>
        <button onClick={handleLogout} className="fc-btn fc-btn-logout">Logout</button>
      </header>
      <main className="fc-dashboard-main" style={{ maxWidth: 500, margin: 'auto' }}>
        <h2>Join a Form</h2>
        <form onSubmit={handleJoin} className="fc-form">
          <label htmlFor="formCode">Enter Form Code:</label>
          <input
            type="text"
            id="formCode"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            required
            className="fc-input"
            style={{ marginBottom: 20 }}
          />
          <button type="submit" className="fc-btn fc-btn-primary">Join Form</button>
        </form>
      </main>
    </div>
  );
};

export default UserDashboard;
