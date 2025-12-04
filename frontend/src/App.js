import { useEffect, useState, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Eager load critical pages
import Selection from "@/pages/Selection";
import Login from "@/pages/Login";

// Lazy load other pages for better performance
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SimpleDashboard = lazy(() => import("@/pages/SimpleDashboard"));
const MedicationGuide = lazy(() => import("@/pages/MedicationGuide"));
const DrugInteraction = lazy(() => import("@/pages/DrugInteraction"));
const Toxicology = lazy(() => import("@/pages/Toxicology"));
const DoseCalculator = lazy(() => import("@/pages/DoseCalculator"));
const History = lazy(() => import("@/pages/History"));
const ChatHistory = lazy(() => import("@/pages/ChatHistory"));
const Admin = lazy(() => import("@/pages/Admin"));
const Profile = lazy(() => import("@/pages/Profile"));
const DatabaseManager = lazy(() => import("@/pages/DatabaseManager"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

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
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
            path="/dose-calculator" 
            element={
              <ProtectedRoute>
                <DoseCalculator />
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
            path="/chat-history" 
            element={
              <ProtectedRoute>
                <ChatHistory />
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
          {/* ExamReader route removed */}
          
          {/* Catch all - redirect to home (which will redirect to login if needed) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
    </ThemeProvider>
  );
}

export default App;
