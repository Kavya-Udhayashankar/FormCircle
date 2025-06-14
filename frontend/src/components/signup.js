import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/signup", formData);
      alert("Signup successful!");
      navigate("/login");
    } catch (err) {
      alert("Signup failed. Please try again.");
      console.error("Signup error:", err);
    }
  };

  return (
    <div className="fc-auth-container">
      <div className="fc-auth-card">
        <h1 className="fc-brand">FormCircle</h1>
        <h2>Signup</h2>
        <form onSubmit={handleSubmit} className="fc-form">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="fc-input"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="fc-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="fc-input"
          />
          <select name="role" value={formData.role} onChange={handleChange} className="fc-input">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="fc-btn fc-btn-primary">Signup</button>
        </form>
        <p>Already have an account? <button className="fc-link" onClick={() => navigate("/login")}>Login here</button></p>
      </div>
    </div>
  );
};

export default Signup;
