import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Departments from "@/pages/Departments";
import Staff from "@/pages/Staff";
import Subjects from "@/pages/Subjects";
import Classes from "@/pages/Classes";
import TimeSlots from "@/pages/TimeSlots";
import TimetableManager from "@/pages/TimetableManager";
import TimetableView from "@/pages/TimetableView";
import RoleHome from "@/pages/RoleHome";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/role-home" element={<RoleHome />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
      <Route path="/time-slots" element={<ProtectedRoute><TimeSlots /></ProtectedRoute>} />
      <Route path="/timetable-manager" element={<ProtectedRoute><TimetableManager /></ProtectedRoute>} />
      <Route path="/timetable-view" element={<ProtectedRoute><TimetableView /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;