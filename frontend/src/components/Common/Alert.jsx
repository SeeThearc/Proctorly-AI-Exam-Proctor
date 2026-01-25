import React from 'react';
import './Alert.css';

const Alert = ({ 
  type = 'info', 
  message, 
  onClose,
  dismissible = false 
}) => {
  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        <span className="alert-icon">{getIcon(type)}</span>
        <span className="alert-message">{message}</span>
      </div>
      {dismissible && (
        <button className="alert-close" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
};

const getIcon = (type) => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning':  return '⚠';
    case 'info': return 'ℹ';
    default:  return 'ℹ';
  }
};

export default Alert;