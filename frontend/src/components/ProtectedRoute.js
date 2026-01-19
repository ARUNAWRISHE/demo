import React from "react";
import { useLocation, Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = location.state?.user;

  // If no user in state, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  if (user.role !== "admin") {
    return <Navigate to="/role-home" state={{ user }} replace />;
  }

  return React.cloneElement(children, { user });
}

export default ProtectedRoute;