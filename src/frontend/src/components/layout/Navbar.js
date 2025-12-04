import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';

const Navbar = () => {
  const authContext = useContext(AuthContext);
  
  const { isAuthenticated, user, logout } = authContext;
  
  const onLogout = () => {
    logout();
  };

  const authLinks = (
    <>
      <li>Hello {user && user.name}</li>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li>
        <Link to="/leads">Leads</Link>
      </li>
      <li>
        <Link to="/scripts">Scripts</Link>
      </li>
      <li>
        <Link to="/calls">Calls</Link>
      </li>
      <li>
        <a onClick={onLogout} href="#!">
          <span className="hide-sm">Logout</span>
        </a>
      </li>
    </>
  );

  const guestLinks = (
    <>
      <li>
        <Link to="/login">Login</Link>
      </li>
      <li>
        <Link to="/register">Register</Link>
      </li>
    </>
  );

  return (
    <nav className="navbar bg-dark">
      <h1>
        <Link to="/">
          <i className="fas fa-robot"></i> AI Voice Agent
        </Link>
      </h1>
      <ul>
        {isAuthenticated ? authLinks : guestLinks}
      </ul>
    </nav>
  );
};

export default Navbar;