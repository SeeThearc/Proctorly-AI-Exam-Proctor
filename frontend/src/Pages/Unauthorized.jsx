import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Common/Button';
import './ErrorPages.css';

const Unauthorized = () => {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">403</h1>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page. </p>
        <Link to="/">
          <Button variant="primary" size="large">
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;