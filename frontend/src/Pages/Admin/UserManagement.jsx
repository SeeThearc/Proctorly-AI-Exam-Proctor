import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loader from '../../components/Common/Loader';
import Modal from '../../components/Common/Modal';
import Alert from '../../components/Common/Alert';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null, userName: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data. users);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u. isActive === (statusFilter === 'active'));
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.studentId?. toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.facultyId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await api.put(`/admin/users/${userId}/toggle`);
      if (response.data.success) {
        setUsers(users.map(u =>
          u._id === userId ? { ...u, isActive: response.data.isActive } : u
        ));
        setMessage({
          type: 'success',
          text: `User ${response.data.isActive ? 'activated' : 'deactivated'} successfully`
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text:  error.response?.data?.message || 'Failed to update user status' });
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await api.delete(`/admin/users/${deleteModal. userId}`);
      if (response.data.success) {
        setUsers(users.filter(u => u._id !== deleteModal. userId));
        setMessage({ type: 'success', text:  'User deleted successfully' });
        setDeleteModal({ isOpen: false, userId: null, userName: '' });
        setTimeout(() => setMessage({ type:  '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete user' });
      setDeleteModal({ isOpen: false, userId: null, userName: '' });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader fullScreen message="Loading users..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="user-management-container">
        <div className="page-header">
          <div>
            <h1>User Management</h1>
            <p>Manage all system users</p>
          </div>
          <Link to="/admin/users/create">
            <Button variant="primary" size="large">
              ➕ Create User
            </Button>
          </Link>
        </div>

        {message.text && (
          <Alert
            type={message.type}
            message={message.text}
            dismissible
            onClose={() => setMessage({ type: '', text: '' })}
          />
        )}

        {/* Filters */}
        <Card>
          <div className="filters-container">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-selects">
              <select
                className="filter-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
              </select>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <div className="table-header">
            <h3>Users ({filteredUsers.length})</h3>
          </div>
          
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <h3>No users found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-name">
                          <strong>{user.name}</strong>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.studentId || user.facultyId || '-'}</td>
                      <td>{user.department || '-'}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant={user.isActive ? 'warning' : 'success'}
                            size="small"
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => setDeleteModal({ isOpen: true, userId: user._id, userName: user.name })}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
          title="Delete User"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteUser}>
                Delete
              </Button>
            </>
          }
        >
          <p>Are you sure you want to delete <strong>{deleteModal.userName}</strong>?</p>
          <p className="warning-text">This action cannot be undone. </p>
        </Modal>
      </div>
    </>
  );
};

export default UserManagement;