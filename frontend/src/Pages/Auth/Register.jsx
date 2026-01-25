import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Alert from '../../components/Common/Alert';
import './Auth.css';


const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    facultyId: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  // Validation
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (formData. password.length < 6) {
    setError('Password must be at least 6 characters');
    return;
  }

  if (formData.role === 'student' && !formData.studentId) {
    setError('Student ID is required');
    return;
  }

  if (formData.role === 'faculty' && !formData.facultyId) {
    setError('Faculty ID is required');
    return;
  }

  setLoading(true);

  // Remove confirmPassword and empty studentId/facultyId
  const { confirmPassword, ...registerData } = formData;
  
  // ✅ FIX: Remove empty or irrelevant ID fields based on role
  if (registerData.role === 'student') {
    delete registerData.facultyId; // Remove facultyId for students
  } else if (registerData.role === 'faculty') {
    delete registerData.studentId; // Remove studentId for faculty
  }

  // Remove empty department if not provided
  if (!registerData.department) {
    delete registerData. department;
  }

  const result = await register(registerData);

  if (result.success) {
    if (result.user.role === 'student') {
      navigate('/student/face-setup');
    } else {
      const dashboardRoute = {
        admin: '/admin',
        faculty:  '/faculty',
        student: '/student'
      }[result. user.role];
      navigate(dashboardRoute);
    }
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
          <h2>Create your account</h2>
        </div>

        {error && <Alert type="error" message={error} dismissible onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          <div className="input-wrapper">
            <label className="input-label">
              Role <span className="input-required">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <Input
              label="Student ID"
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Enter your student ID"
              required
            />
          )}

          {formData.role === 'faculty' && (
            <Input
              label="Faculty ID"
              type="text"
              name="facultyId"
              value={formData.facultyId}
              onChange={handleChange}
              placeholder="Enter your faculty ID"
              required
            />
          )}

          <Input
            label="Department"
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Enter your department"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password (min 6 characters)"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Register
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;