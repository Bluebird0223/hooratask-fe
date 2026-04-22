// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/api';

const SettlementView = () => {
  const [settlements, setSettlements] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getSettlements();
      setSettlements(response.data.data);
      setTotalTransactions(response.data.totalTransactions);
      setError('');
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setError('Failed to fetch settlements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Calculating optimal settlements...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (settlements.length === 0) {
    return (
      <div className="settlement-view">
        <h2>Optimized Settlements</h2>
        <div className="empty-state">No settlements needed! Everyone is settled up.</div>
      </div>
    );
  }

  return (
    <div className="settlement-view">
      <h2>Optimized Settlements</h2>
      <div className="settlement-info">
        <p>Minimum transactions needed: <strong>{totalTransactions}</strong></p>
        <p className="info-text">✨ These are the most efficient payments to settle all balances</p>
      </div>
      
      <div className="settlements-list">
        {settlements.map((settlement, index) => (
          <div key={index} className="settlement-card">
            <div className="settlement-flow">
              <span className="from">{settlement.from}</span>
              <span className="arrow">→</span>
              <span className="to">{settlement.to}</span>
            </div>
            <div className="settlement-amount">
              <span className="currency">₹</span>
              <span className="amount">{settlement.amount}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="settlement-summary">
        <h3>How to settle:</h3>
        <ul>
          {settlements.map((settlement, index) => (
            <li key={index}>
              <strong>{settlement.from}</strong> should pay <strong>{settlement.to}</strong> ₹{settlement.amount}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SettlementView;
