import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // If no user in state, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  if (user.role !== "admin") {
    return <Navigate to="/role-home" replace />;
  }

  return React.cloneElement(children, { user });
}

export default ProtectedRoute;