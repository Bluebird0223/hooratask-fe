// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/api';

const BalanceView = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getBalances();
      setBalances(response.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching balances:', error);
      setError('Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading balances...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (balances.length === 0) {
    return (
      <div className="balance-view">
        <h2>Balances</h2>
        <div className="empty-state">No outstanding balances. Everyone is settled up!</div>
      </div>
    );
  }

  return (
    <div className="balance-view">
      <h2>Balance Summary</h2>
      <div className="balances-list">
        {balances.map((balance, index) => (
          <div key={index} className={`balance-card ${balance.status === 'is owed' ? 'positive' : 'negative'}`}>
            <div className="user-name">{balance.user}</div>
            <div className="balance-details">
              {balance.status === 'is owed' ? (
                <span className="positive-text">
                  is owed ₹{balance.amount}
                </span>
              ) : (
                <span className="negative-text">
                  owes ₹{balance.amount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BalanceView;
