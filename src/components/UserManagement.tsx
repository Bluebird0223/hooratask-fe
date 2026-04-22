// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!newUser.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    
    setLoading(true);
    try {
      await userService.createUser(newUser);
      setSuccess('User created successfully!');
      setNewUser({ name: '', email: '' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Error creating user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-manager">
      <h2>Manage Users</h2>
      
      <div className="add-user-form">
        <h3>Add New User</h3>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={newUser.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              placeholder="Email Address"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
      
      <div className="users-list">
        <h3>Existing Users ({users.length})</h3>
        <div className="users-grid">
          {users.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManager;
