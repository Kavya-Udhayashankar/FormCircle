import React from "react";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import CreateForm from "./createform";
import ViewForms from "./viewform";
import ViewResponses from "./viewresponse";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="fc-dashboard-container">
      <header className="fc-dashboard-header">
        <div className="fc-brand">FormCircle</div>
        <div className="fc-greeting">Hi, {name}</div>
        <button onClick={handleLogout} className="fc-btn fc-btn-logout">Logout</button>
      </header>
      <nav className="fc-dashboard-nav">
        <button onClick={() => navigate("create")} className="fc-btn fc-btn-nav">Create Form</button>
        <button onClick={() => navigate("forms")} className="fc-btn fc-btn-nav">View Forms</button>
        <button onClick={() => navigate("responses")} className="fc-btn fc-btn-nav">View Responses</button>
      </nav>
      <main className="fc-dashboard-main">
        <Routes>
          <Route path="create" element={<CreateForm />} />
          <Route path="forms" element={<ViewForms />} />
          <Route path="responses" element={<ViewResponses />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
