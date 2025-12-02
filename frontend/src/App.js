import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Dashboard from "@/pages/Dashboard";
import SimpleDashboard from "@/pages/SimpleDashboard";
import MedicationGuide from "@/pages/MedicationGuide";
import DrugInteraction from "@/pages/DrugInteraction";
import Toxicology from "@/pages/Toxicology";
import Selection from "@/pages/Selection";
import Login from "@/pages/Login";
import History from "@/pages/History";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";
import DatabaseManager from "@/pages/DatabaseManager";
import ExamReader from "@/pages/ExamReader";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Selection />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/detailed" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/simple" 
            element={
              <ProtectedRoute>
                <SimpleDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/medication" 
            element={
              <ProtectedRoute>
                <MedicationGuide />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/interaction" 
            element={
              <ProtectedRoute>
                <DrugInteraction />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/toxicology" 
            element={
              <ProtectedRoute>
                <Toxicology />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/database" 
            element={
              <ProtectedRoute>
                <DatabaseManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/exam-reader" 
            element={
              <ProtectedRoute>
                <ExamReader />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to home (which will redirect to login if needed) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
