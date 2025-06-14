import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Signup from "./components/signup";
import Login from "./components/login";
import PrivateRoute from "./components/privateroute";
import AdminDashboard from "./components/admindashboard";
import UserDashboard from "./components/userdashboard";
import JoinForm from './components/joinform';
import Unauthorized from './components/unauthorized';
import CreateForm from './components/createform';
import ViewForms from './components/viewform';
import ViewResponses from './components/viewresponse';
import FormHistory from "./pages/formhistory";
import "./formcircle.css";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <AdminDashboard />
          </PrivateRoute>
        }
      >
        <Route path="create" element={<CreateForm />} />
        <Route path="forms" element={<ViewForms />} />
        <Route path="responses" element={<ViewResponses />} />
      </Route>

      {/* Protected User Route */}
      <Route
        path="/user"
        element={
          <PrivateRoute role="user">
            <UserDashboard />
          </PrivateRoute>
        }
      />

      {/* Form Page - accessible by both admin and user */}
      <Route
        path="/form/:code"
        element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <JoinForm />
          </PrivateRoute>
        }
      />

      {/* History Page - accessible by both admin and user */}
      <Route
        path="/form/:code/history"
        element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <FormHistory />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
