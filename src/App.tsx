import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { expenseService, userService } from './services/api';

type SplitType = 'equal' | 'unequal';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface ExpenseParticipant {
  user: User;
  amount: number;
}

interface Expense {
  _id: string;
  description: string;
  totalAmount: number;
  payer: User;
  participants: ExpenseParticipant[];
  splitType: SplitType;
  date: string;
}

interface BalanceItem {
  user: string;
  status: 'owes' | 'is owed';
  amount: number;
}

interface SettlementItem {
  from: string;
  to: string;
  amount: number;
}

interface UserFormState {
  name: string;
  email: string;
}

interface ExpenseFormState {
  description: string;
  totalAmount: string;
  payer: string;
  splitType: SplitType;
  participantIds: string[];
  customAmounts: Record<string, string>;
}

const initialUserForm: UserFormState = {
  name: '',
  email: '',
};

const initialExpenseForm: ExpenseFormState = {
  description: '',
  totalAmount: '',
  payer: '',
  splitType: 'equal',
  participantIds: [],
  customAmounts: {},
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [userForm, setUserForm] = useState<UserFormState>(initialUserForm);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [userMessage, setUserMessage] = useState('');
  const [expenseMessage, setExpenseMessage] = useState('');
  const [pageError, setPageError] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [refreshing, setRefreshing] = useState({
    users: false,
    expenses: false,
    balances: false,
    settlements: false,
  });

  const totalExpenseAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.totalAmount, 0),
    [expenses]
  );

  const outstandingAmount = useMemo(
    () =>
      balances.reduce((sum, balance) => {
        if (balance.status === 'owes') {
          return sum + balance.amount;
        }
        return sum;
      }, 0),
    [balances]
  );

  const fetchUsers = async () => {
    setRefreshing((prev) => ({ ...prev, users: true }));
    try {
      const response = await userService.getUsers();
      setUsers(response.data.data ?? []);
    } finally {
      setRefreshing((prev) => ({ ...prev, users: false }));
    }
  };

  const fetchExpenses = async () => {
    setRefreshing((prev) => ({ ...prev, expenses: true }));
    try {
      const response = await expenseService.getAllExpenses();
      setExpenses(response.data.data ?? []);
    } finally {
      setRefreshing((prev) => ({ ...prev, expenses: false }));
    }
  };

  const fetchBalances = async () => {
    setRefreshing((prev) => ({ ...prev, balances: true }));
    try {
      const response = await expenseService.getBalances();
      setBalances(response.data.data ?? []);
    } finally {
      setRefreshing((prev) => ({ ...prev, balances: false }));
    }
  };

  const fetchSettlements = async () => {
    setRefreshing((prev) => ({ ...prev, settlements: true }));
    try {
      const response = await expenseService.getSettlements();
      setSettlements(response.data.data ?? []);
    } finally {
      setRefreshing((prev) => ({ ...prev, settlements: false }));
    }
  };

  const bootstrapDashboard = async () => {
    setIsBootstrapping(true);
    setPageError('');

    try {
      await Promise.all([fetchUsers(), fetchExpenses(), fetchBalances(), fetchSettlements()]);
    } catch (error) {
      console.error('Dashboard bootstrap failed:', error);
      setPageError('Unable to load data. Please make sure the backend is running.');
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    bootstrapDashboard();
  }, []);

  const handleUserChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
    setUserMessage('');
  };

  const handleExpenseChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
    setExpenseMessage('');
  };

  const toggleParticipant = (userId: string) => {
    setExpenseMessage('');
    setExpenseForm((prev) => {
      const exists = prev.participantIds.includes(userId);
      const participantIds = exists
        ? prev.participantIds.filter((id) => id !== userId)
        : [...prev.participantIds, userId];

      const customAmounts = { ...prev.customAmounts };
      if (exists) {
        delete customAmounts[userId];
      }

      const payer = participantIds.includes(prev.payer) ? prev.payer : '';

      return {
        ...prev,
        participantIds,
        customAmounts,
        payer,
      };
    });
  };

  const handleCustomAmountChange = (userId: string, value: string) => {
    setExpenseMessage('');
    setExpenseForm((prev) => ({
      ...prev,
      customAmounts: {
        ...prev.customAmounts,
        [userId]: value,
      },
    }));
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUserMessage('');

    if (!userForm.name.trim() || !userForm.email.trim()) {
      setUserMessage('Please enter both a name and an email address.');
      return;
    }

    setIsAddingUser(true);
    try {
      await userService.createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
      });
      setUserForm(initialUserForm);
      setUserMessage('User saved successfully.');
      await fetchUsers();
    } catch (error: any) {
      setUserMessage(error.response?.data?.error || 'Unable to save the user right now.');
    } finally {
      setIsAddingUser(false);
    }
  };

  const validateExpenseForm = () => {
    const amount = Number(expenseForm.totalAmount);

    if (!expenseForm.description.trim()) {
      return 'Description is required.';
    }

    if (!amount || amount <= 0) {
      return 'Enter a valid total amount.';
    }

    if (expenseForm.participantIds.length < 2) {
      return 'Pick at least two participants.';
    }

    if (!expenseForm.payer) {
      return 'Choose who paid for the expense.';
    }

    if (!expenseForm.participantIds.includes(expenseForm.payer)) {
      return 'The payer must also be included as a participant.';
    }

    if (expenseForm.splitType === 'unequal') {
      const totalCustom = expenseForm.participantIds.reduce((sum, userId) => {
        return sum + Number(expenseForm.customAmounts[userId] || 0);
      }, 0);

      if (Math.abs(totalCustom - amount) > 0.01) {
        return 'Unequal split amounts must add up to the total expense amount.';
      }
    }

    return '';
  };

  const handleCreateExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validateExpenseForm();

    if (validationMessage) {
      setExpenseMessage(validationMessage);
      return;
    }

    setIsAddingExpense(true);
    try {
      await expenseService.createExpense({
        description: expenseForm.description.trim(),
        totalAmount: Number(expenseForm.totalAmount),
        payer: expenseForm.payer,
        splitType: expenseForm.splitType,
        participants: expenseForm.participantIds.map((userId) => ({
          user: userId,
          amount:
            expenseForm.splitType === 'equal'
              ? 0
              : Number(expenseForm.customAmounts[userId] || 0),
        })),
      });

      setExpenseForm(initialExpenseForm);
      setExpenseMessage('Expense added successfully.');
      await Promise.all([fetchExpenses(), fetchBalances(), fetchSettlements()]);
    } catch (error: any) {
      setExpenseMessage(error.response?.data?.error || 'Unable to add the expense.');
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const confirmed = window.confirm('Delete this expense?');
    if (!confirmed) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      await Promise.all([fetchExpenses(), fetchBalances(), fetchSettlements()]);
    } catch (error) {
      console.error('Delete expense failed:', error);
      setExpenseMessage('Unable to delete that expense right now.');
    }
  };

  if (isBootstrapping) {
    return (
      <main className="page">
        <div className="loading-box">Loading expense tracker...</div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Expense Tracker</h1>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span>Total users</span>
          <strong>{users.length}</strong>
        </div>
        <div className="summary-card">
          <span>Total expenses</span>
          <strong>{expenses.length}</strong>
        </div>
        <div className="summary-card">
          <span>Total tracked</span>
          <strong>{formatCurrency(totalExpenseAmount)}</strong>
        </div>
        <div className="summary-card">
          <span>Outstanding</span>
          <strong>{formatCurrency(outstandingAmount)}</strong>
        </div>
      </section>

      {pageError ? <div className="alert error">{pageError}</div> : null}

      <section className="layout">
        <article className="section-card">
          <div className="section-header">
            <div>
              <h2>Add User</h2>
            </div>
            <button type="button" onClick={fetchUsers} disabled={refreshing.users}>
              {refreshing.users ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <form className="form-grid" onSubmit={handleCreateUser}>
            <label>
              Name
              <input
                name="name"
                value={userForm.name}
                onChange={handleUserChange}
                placeholder="Aman Gupta"
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleUserChange}
                placeholder="aman@example.com"
              />
            </label>

            {userMessage ? <div className="alert info">{userMessage}</div> : null}

            <button type="submit" disabled={isAddingUser}>
              {isAddingUser ? 'Saving...' : 'Save User'}
            </button>
          </form>
        </article>

        <article className="section-card">
          <div className="section-header">
            <h2>Create Expense</h2>
          </div>

          <form className="form-grid" onSubmit={handleCreateExpense}>
            <label>
              Description
              <input
                name="description"
                value={expenseForm.description}
                onChange={handleExpenseChange}
                placeholder="Dinner at restaurant"
              />
            </label>

            <div className="two-column">
              <label>
                Total Amount
                <input
                  name="totalAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseForm.totalAmount}
                  onChange={handleExpenseChange}
                  placeholder="0.00"
                />
              </label>

              <label>
                Split Type
                <select
                  name="splitType"
                  value={expenseForm.splitType}
                  onChange={handleExpenseChange}
                >
                  <option value="equal">Equal</option>
                  <option value="unequal">Unequal</option>
                </select>
              </label>
            </div>

            <div className="checkbox-group">
              <span>Participants</span>
              <div className="checkbox-list">
                {users.map((user) => (
                  <label key={user._id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={expenseForm.participantIds.includes(user._id)}
                      onChange={() => toggleParticipant(user._id)}
                    />
                    <span>{user.name} ({user.email})</span>
                  </label>
                ))}
              </div>
            </div>

            {expenseForm.splitType === 'unequal' && expenseForm.participantIds.length > 0 ? (
              <div className="custom-splits">
                <span>Unequal Split Amounts</span>
                {expenseForm.participantIds.map((userId) => {
                  const participant = users.find((user) => user._id === userId);
                  return (
                    <label key={userId} className="split-row">
                      <span>{participant?.name}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseForm.customAmounts[userId] || ''}
                        onChange={(event) => handleCustomAmountChange(userId, event.target.value)}
                        placeholder="0.00"
                      />
                    </label>
                  );
                })}
              </div>
            ) : null}

             <label>
              Payer
              <select name="payer" value={expenseForm.payer} onChange={handleExpenseChange}>
                <option value="">Select payer</option>
                {users
                  .filter((user) => expenseForm.participantIds.includes(user._id))
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </label>

            {expenseMessage ? <div className="alert info">{expenseMessage}</div> : null}

            <button type="submit" disabled={isAddingExpense}>
              {isAddingExpense ? 'Saving...' : 'Add Expense'}
            </button>
          </form>
        </article>
      </section>

      <section className="content-grid">
        {/* <article className="section-card">
          <div className="section-header">
            <h2>Users</h2>
            <button type="button" onClick={fetchUsers} disabled={refreshing.users}>
              {refreshing.users ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {users.length === 0 ? (
            <div className="empty-box">No users yet.</div>
          ) : (
            <div className="simple-list">
              {users.map((user) => (
                <div key={user._id} className="list-item">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              ))}
            </div>
          )}
        </article> */}

        <article className="section-card wide-card">
          <div className="section-header">
            <h2>Expenses</h2>
            <button type="button" onClick={fetchExpenses} disabled={refreshing.expenses}>
              {refreshing.expenses ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-box">No expenses yet.</div>
          ) : (
            <div className="simple-list">
              {expenses.map((expense) => (
                <div key={expense._id} className="list-item">
                  <div className="list-item-top">
                    <div>
                      <strong>{expense.description}</strong>
                      <span>
                        Paid by {expense.payer?.name} on {formatDate(expense.date)}
                      </span>
                    </div>
                    <div className="item-actions">
                      <strong>{formatCurrency(expense.totalAmount)}</strong>
                      <button type="button" className="danger-button" onClick={() => handleDeleteExpense(expense._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="tag-row">
                    {expense.participants.map((participant) => (
                      <span key={participant.user._id} className="tag">
                        {participant.user.name}: {formatCurrency(participant.amount)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="section-card">
          <div className="section-header">
            <h2>Balances</h2>
            <button type="button" onClick={fetchBalances} disabled={refreshing.balances}>
              {refreshing.balances ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {balances.length === 0 ? (
            <div className="empty-box">No outstanding balances.</div>
          ) : (
            <div className="simple-list">
              {balances.map((balance) => (
                <div key={`${balance.user}-${balance.status}`} className="list-item">
                  <strong>{balance.user}</strong>
                  <span>
                    {balance.status === 'is owed' ? 'Should receive' : 'Needs to pay'}{' '}
                    {formatCurrency(balance.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="section-card">
          <div className="section-header">
            <h2>Settlements</h2>
            <button type="button" onClick={fetchSettlements} disabled={refreshing.settlements}>
              {refreshing.settlements ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {settlements.length === 0 ? (
            <div className="empty-box">No settlements needed.</div>
          ) : (
            <div className="simple-list">
              {settlements.map((settlement, index) => (
                <div key={`${settlement.from}-${settlement.to}-${index}`} className="list-item">
                  <strong>
                    {settlement.from} {'->'} {settlement.to}
                  </strong>
                  <span>{formatCurrency(settlement.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

export default App;
