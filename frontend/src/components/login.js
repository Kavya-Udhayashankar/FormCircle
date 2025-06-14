import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", formData);
      const { token, user } = res.data;
      const role = user?.role;

      if (!token || !role) {
        alert("Invalid response from server.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      if (user?.name) localStorage.setItem("name", user.name);

      alert("Login successful!");

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "user") {
        navigate("/user");
      } else {
        navigate("/unauthorized");
      }
    } catch (err) {
      alert("Login failed. Please check your credentials.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="fc-auth-container">
      <div className="fc-auth-card">
        <h1 className="fc-brand">FormCircle</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="fc-form">
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
          <button type="submit" className="fc-btn fc-btn-primary">Login</button>
        </form>
        <p>Don't have an account? <button className="fc-link" onClick={() => navigate("/signup")}>Sign up here</button></p>
      </div>
    </div>
  );
};

export default Login;
