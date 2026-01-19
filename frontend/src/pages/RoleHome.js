import React from "react";
import { useLocation } from "react-router-dom";

function RoleHome() {
  const location = useLocation();
  const user = location.state?.user;

  return (
    <div className="min-h-screen bg-white">
      {/* Empty page for non-admin roles */}
    </div>
  );
}

export default RoleHome;
