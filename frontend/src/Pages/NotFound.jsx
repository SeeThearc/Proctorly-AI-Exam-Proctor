import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Common/Button';
import './ErrorPages.css';

const NotFound = () => {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button variant="primary" size="large">
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;