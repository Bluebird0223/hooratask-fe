// @ts-nocheck
import React from 'react';
import { expenseService } from '../services/api';

const ExpenseList = ({ expenses, onDelete }) => {
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.deleteExpense(id);
        onDelete();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="expense-list">
        <h2>All Expenses</h2>
        <div className="empty-state">No expenses yet. Create your first expense!</div>
      </div>
    );
  }

  return (
    <div className="expense-list">
      <h2>All Expenses</h2>
      <div className="expenses-grid">
        {expenses.map(expense => (
          <div key={expense._id} className="expense-card">
            <div className="expense-header">
              <h3>{expense.description}</h3>
              <button 
                onClick={() => handleDelete(expense._id)}
                className="delete-btn"
              >
                ✕
              </button>
            </div>
            <div className="expense-details">
              <p><strong>Amount:</strong> ₹{expense.totalAmount}</p>
              <p><strong>Payer:</strong> {expense.payer?.name}</p>
              <p><strong>Split:</strong> {expense.splitType === 'equal' ? 'Equal' : 'Unequal'}</p>
              <p><strong>Date:</strong> {formatDate(expense.date)}</p>
              <div className="participants">
                <strong>Participants:</strong>
                <ul>
                  {expense.participants.map(p => (
                    <li key={p.user._id}>
                      {p.user.name}: ₹{p.amount}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseList;
