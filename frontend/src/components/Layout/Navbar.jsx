import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?. role) {
      case 'admin':  return '/admin';
      case 'faculty': return '/faculty';
      case 'student': return '/student';
      default: return '/';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={getDashboardLink()} className="navbar-logo">
          🎓 Proctorly
        </Link>

        {user && (
          <div className="navbar-menu">
            <Link to={getDashboardLink()} className="navbar-link">
              Dashboard
            </Link>

            {user.role === 'student' && (
              <>
                <Link to="/student/exams" className="navbar-link">
                  Exams
                </Link>
                <Link to="/student/history" className="navbar-link">
                  History
                </Link>
              </>
            )}

            {(user.role === 'faculty' || user.role === 'admin') && (
              <>
                <Link to="/faculty/exams" className="navbar-link">
                  My Exams
                </Link>
                <Link to="/faculty/exams/create" className="navbar-link">
                  Create Exam
                </Link>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Link to="/admin/users" className="navbar-link">
                  Users
                </Link>
                <Link to="/admin/stats" className="navbar-link">
                  Statistics
                </Link>
              </>
            )}

            <div className="navbar-user">
              <span className="navbar-username">{user.name}</span>
              <span className="navbar-role">{user.role}</span>
            </div>

            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;