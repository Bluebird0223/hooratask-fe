// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { expenseService, userService } from '../services/api';

const ExpenseForm = ({ onExpenseCreated }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    payer: '',
    splitType: 'equal',
    participants: []
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleUserSelection = (userId) => {
    let newSelectedUsers;
    if (selectedUsers.includes(userId)) {
      newSelectedUsers = selectedUsers.filter(id => id !== userId);
      const newCustomAmounts = { ...customAmounts };
      delete newCustomAmounts[userId];
      setCustomAmounts(newCustomAmounts);
    } else {
      newSelectedUsers = [...selectedUsers, userId];
    }
    setSelectedUsers(newSelectedUsers);
    setFormData(prev => ({
      ...prev,
      participants: newSelectedUsers.map(userId => ({
        user: userId,
        amount: 0
      }))
    }));
  };

  const handleCustomAmountChange = (userId, amount) => {
    setCustomAmounts(prev => ({
      ...prev,
      [userId]: parseFloat(amount) || 0
    }));
    
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.user === userId ? { ...p, amount: parseFloat(amount) || 0 } : p
      )
    }));
  };

  const validateForm = () => {
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }
    if (!formData.totalAmount || formData.totalAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (!formData.payer) {
      setError('Please select a payer');
      return false;
    }
    if (selectedUsers.length < 2) {
      setError('Please select at least 2 participants');
      return false;
    }
    if (!selectedUsers.includes(formData.payer)) {
      setError('Payer must be one of the participants');
      return false;
    }
    
    if (formData.splitType === 'unequal') {
      const totalCustom = Object.values(customAmounts).reduce((sum, amt) => sum + amt, 0);
      if (Math.abs(totalCustom - parseFloat(formData.totalAmount)) > 0.01) {
        setError(`Custom amounts total (${totalCustom}) does not match expense amount (${formData.totalAmount})`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const expenseData = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        participants: selectedUsers.map(userId => ({
          user: userId,
          amount: formData.splitType === 'equal' ? 0 : (customAmounts[userId] || 0)
        }))
      };
      
      await expenseService.createExpense(expenseData);
      
      // Reset form
      setFormData({
        description: '',
        totalAmount: '',
        payer: '',
        splitType: 'equal',
        participants: []
      });
      setSelectedUsers([]);
      setCustomAmounts({});
      setError('');
      
      onExpenseCreated();
    } catch (error) {
      setError(error.response?.data?.error || 'Error creating expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-form">
      <h2>Add New Expense</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="e.g., Dinner at Restaurant"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Total Amount (₹)</label>
          <input
            type="number"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Payer</label>
          <select
            name="payer"
            value={formData.payer}
            onChange={handleInputChange}
            required
          >
            <option value="">Select payer</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>{user.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Split Type</label>
          <select
            name="splitType"
            value={formData.splitType}
            onChange={handleInputChange}
          >
            <option value="equal">Equal Split</option>
            <option value="unequal">Unequal Split</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Participants</label>
          <div className="participants-list">
            {users.map(user => (
              <label key={user._id} className="participant-checkbox">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => handleUserSelection(user._id)}
                />
                {user.name}
              </label>
            ))}
          </div>
        </div>
        
        {formData.splitType === 'unequal' && selectedUsers.length > 0 && (
          <div className="form-group">
            <label>Custom Amounts</label>
            {selectedUsers.map(userId => {
              const user = users.find(u => u._id === userId);
              return (
                <div key={userId} className="custom-amount">
                  <span>{user?.name}:</span>
                  <input
                    type="number"
                    value={customAmounts[userId] || ''}
                    onChange={(e) => handleCustomAmountChange(userId, e.target.value)}
                    placeholder="Amount"
                    step="0.01"
                  />
                </div>
              );
            })}
          </div>
        )}
        
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Creating...' : 'Create Expense'}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;
