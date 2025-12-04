import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import Leads from './components/leads/Leads';
import Scripts from './components/scripts/Scripts';
import Calls from './components/calls/Calls';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PrivateRoute from './components/routing/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/leads" 
            element={
              <PrivateRoute>
                <Leads />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/scripts" 
            element={
              <PrivateRoute>
                <Scripts />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/calls" 
            element={
              <PrivateRoute>
                <Calls />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;