import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const sessionId = params.get("session_id");

      if (!sessionId) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/session`,
          {},
          {
            headers: { "X-Session-ID": sessionId },
            withCredentials: true,
          }
        );

        const user = response.data;
        navigate("/", { state: { user }, replace: true });
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/login");
      }
    };

    processSession();
  }, [location.hash, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}

export default AuthCallback;