import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Alert from '../../components/Common/Alert';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const dashboardRoute = {
        admin: '/admin',
        faculty:  '/faculty',
        student: '/student'
      }[user.role];
      navigate(dashboardRoute);
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:  e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData. email, formData.password);

    if (result.success) {
      const dashboardRoute = {
        admin:  '/admin',
        faculty: '/faculty',
        student: '/student'
      }[result.user.role];
      
      navigate(dashboardRoute);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎓 AI Proctoring System</h1>
          <h2>Login to your account</h2>
        </div>

        {error && <Alert type="error" message={error} dismissible onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData. email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Login
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;