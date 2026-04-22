import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const userService = {
  createUser: (userData: { name: string; email: string }) => api.post('/users', userData),
  getUsers: () => api.get('/users')
};

export const expenseService = {
  createExpense: (expenseData: {
    description: string;
    totalAmount: number;
    payer: string;
    splitType: 'equal' | 'unequal';
    participants: Array<{ user: string; amount: number }>;
  }) => api.post('/expenses', expenseData),
  getAllExpenses: () => api.get('/expenses'),
  deleteExpense: (id: string) => api.delete(`/expenses/${id}`),
  getBalances: () => api.get('/balances'),
  getSettlements: () => api.get('/settlements')
};

export default api;
