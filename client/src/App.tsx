import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Groups from './pages/Groups';
import GroupConfig from './pages/GroupConfig';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Profile from './pages/Profile';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="d-flex">
                    <Sidebar />
                    <div className="flex-grow-1">
                      <Navbar />
                      <main className="container-fluid px-4 py-3">
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/sessions" element={<Sessions />} />
                          <Route path="/groups" element={<Groups />} />
                          <Route path="/groups/:id/config" element={<GroupConfig />} />
                          <Route path="/users" element={<Users />} />
                          <Route path="/logs" element={<Logs />} />
                          <Route path="/profile" element={<Profile />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
          <Toaster position="top-right" />
        </WebSocketProvider>
      </AuthProvider>
    </div>
  );
}

export default App;