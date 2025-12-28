import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';

const Dashboard = () => {
  const authContext = useContext(AuthContext);

  useEffect(() => {
    authContext.loadUser();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="container">
      <h1>AI Voice Agent Dashboard</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Leads</h3>
          <p>0</p>
        </div>
        <div className="stat-card">
          <h3>Calls Today</h3>
          <p>0</p>
        </div>
        <div className="stat-card">
          <h3>Appointments Scheduled</h3>
          <p>0</p>
        </div>
        <div className="stat-card">
          <h3>Conversion Rate</h3>
          <p>0%</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/leads" className="btn btn-primary">Manage Leads</Link>
        <Link to="/scripts" className="btn btn-secondary">Manage Scripts</Link>
        <Link to="/calls" className="btn btn-secondary">View Call History</Link>
      </div>

      <div className="dashboard-info">
        <h2>System Status</h2>
        <p>AI Voice Agent is currently <span className="status-indicator status-active">Active</span></p>
        <p>Capacity: 0/2200 calls per day</p>
      </div>
    </div>
  );
};

export default Dashboard;