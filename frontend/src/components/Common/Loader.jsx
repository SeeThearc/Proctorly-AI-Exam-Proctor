import React from 'react';
import './Loader.css';

const Loader = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        <div className="loader-spinner"></div>
        <p className="loader-message">{message}</p>
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <p className="loader-message">{message}</p>
    </div>
  );
};

export default Loader;