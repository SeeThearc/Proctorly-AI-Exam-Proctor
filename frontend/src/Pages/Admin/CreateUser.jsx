import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import Alert from '../../components/Common/Alert';
import './CreateUser.css';

const CreateUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    facultyId: '',
    department: ''
  });

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
    setSuccess('');

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'student' && !formData.studentId) {
      setError('Student ID is required for students');
      return;
    }

    if (formData.role === 'faculty' && !formData.facultyId) {
      setError('Faculty ID is required for faculty');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/admin/users', formData);

      if (response.data.success) {
        setSuccess('User created successfully!');
        setTimeout(() => {
          navigate('/admin/users');
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-user-container">
        <div className="page-header">
          <h1>Create New User</h1>
          <p>Add a new user to the system</p>
        </div>

        {error && <Alert type="error" message={error} dismissible onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData. email}
                onChange={handleChange}
                placeholder="Enter email address"
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
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <Input
                  label="Student ID"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="Enter student ID"
                  required
                />
              )}

              {formData.role === 'faculty' && (
                <Input
                  label="Faculty ID"
                  name="facultyId"
                  value={formData. facultyId}
                  onChange={handleChange}
                  placeholder="Enter faculty ID"
                  required
                />
              )}

              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Enter department"
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password (min 6 characters)"
                required
              />
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                size="large"
                onClick={() => navigate('/admin/users')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="large"
                loading={loading}
              >
                Create User
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};

export default CreateUser;