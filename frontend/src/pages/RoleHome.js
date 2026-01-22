import React from "react";
import { useAuth } from "@/contexts/AuthContext";

function RoleHome() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Empty page for non-admin roles */}
    </div>
  );
}

export default RoleHome;
