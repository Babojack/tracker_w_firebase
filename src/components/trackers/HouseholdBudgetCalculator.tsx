import React, { useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { debounce } from 'lodash';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

// --------------------------------------------------------
// 1. Types and Interfaces
// --------------------------------------------------------
interface FinancialEntry {
  category: string;
  amount: string;
  purpose: string;
  userId?: string;
  month?: string; // Month in the format "YYYY-MM"
}

interface BudgetData {
  incomes: (FinancialEntry & { id: string })[];
  expenses: (FinancialEntry & { id: string })[];
}

// Helper function to parse German number formats (comma as decimal separator)
function parseGermanFloat(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

// --------------------------------------------------------
// 2. Export/Import Functions
// --------------------------------------------------------
export function exportData(data: any, filename: string = 'progress.json') {
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function importData(callback: (data: any) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          callback(importedData);
        } catch (error) {
          console.error('Import error', error);
          alert('Could not import file');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// --------------------------------------------------------
// 3. Main Component: HouseholdBudgetCalculator
// --------------------------------------------------------
const HouseholdBudgetCalculator: React.FC = () => {
  // Default categories
  const defaultIncomeCategories = [
    'Salary Person 1',
    'Salary Person 2',
    'Side Job',
    'Other Income',
  ];
  const defaultExpenseCategories = [
    'Rent/Mortgage',
    'Utilities',
    'Groceries',
    'Transportation',
    'Insurance',
  ];

  // State for the selected month as a Date
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // State for incomes and expenses (each document has its own ID)
  const [incomes, setIncomes] = useState<(FinancialEntry & { id: string })[]>([]);
  const [expenses, setExpenses] = useState<(FinancialEntry & { id: string })[]>([]);

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' }>({
    message: '',
    type: 'success',
  });
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'success' }), 3000);
  };

  // Debounced update functions for incomes and expenses
  const debouncedIncomeUpdate = debounce((id: string, field: keyof FinancialEntry, value: string) => {
    updateDoc(doc(db, 'incomes', id), { [field]: value }).catch((error) =>
      console.error('Error updating income entry:', error)
    );
  }, 300, { maxWait: 500 });

  const debouncedExpenseUpdate = debounce((id: string, field: keyof FinancialEntry, value: string) => {
    updateDoc(doc(db, 'expenses', id), { [field]: value }).catch((error) =>
      console.error('Error updating expense entry:', error)
    );
  }, 300, { maxWait: 500 });

  // Flush pending updates on page unload (so changes are sent even on rapid refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      debouncedIncomeUpdate.flush();
      debouncedExpenseUpdate.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Load data from Firestore for the current user and the selected month
  useEffect(() => {
    const monthString = selectedMonth.toISOString().slice(0, 7);
    const fetchData = async () => {
      // Fetch incomes
      try {
        const incomesQuery = query(
          collection(db, 'incomes'),
          where('userId', '==', auth.currentUser ? auth.currentUser.uid : ''),
          where('month', '==', monthString)
        );
        const incomesSnap = await getDocs(incomesQuery);
        let loadedIncomes = incomesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as (FinancialEntry & { id: string })[];

        // If no incomes found for the selected month, create default entries for this month
        if (loadedIncomes.length === 0) {
          const defaultIncomes = defaultIncomeCategories.map((category) => ({
            category,
            amount: '0',
            purpose: '',
            userId: auth.currentUser ? auth.currentUser.uid : '',
            month: monthString,
          }));
          for (const income of defaultIncomes) {
            const docRef = await addDoc(collection(db, 'incomes'), income);
            loadedIncomes.push({ id: docRef.id, ...income });
          }
        }
        setIncomes(loadedIncomes);
      } catch (error) {
        console.error('Error loading incomes:', error);
      }

      // Fetch expenses
      try {
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', auth.currentUser ? auth.currentUser.uid : ''),
          where('month', '==', monthString)
        );
        const expensesSnap = await getDocs(expensesQuery);
        let loadedExpenses = expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as (FinancialEntry & { id: string })[];

        // If no expenses found for the selected month, create default entries for this month
        if (loadedExpenses.length === 0) {
          const defaultExpenses = defaultExpenseCategories.map((category) => ({
            category,
            amount: '0',
            purpose: '',
            userId: auth.currentUser ? auth.currentUser.uid : '',
            month: monthString,
          }));
          for (const expense of defaultExpenses) {
            const docRef = await addDoc(collection(db, 'expenses'), expense);
            loadedExpenses.push({ id: docRef.id, ...expense });
          }
        }
        setExpenses(loadedExpenses);
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    };

    fetchData();
  }, [selectedMonth]);

  // Calculate totals
  const calculateTotals = () => {
    const totalIncome = incomes.reduce(
      (sum, entry) => sum + parseGermanFloat(entry.amount || '0'),
      0
    );
    const totalExpenses = expenses.reduce(
      (sum, entry) => sum + parseGermanFloat(entry.amount || '0'),
      0
    );
    const balance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, balance };
  };

  // Add a new row
  const addIncomeRow = async () => {
    try {
      const monthString = selectedMonth.toISOString().slice(0, 7);
      const newIncome: FinancialEntry = {
        category: 'New Income',
        amount: '0',
        purpose: '',
        userId: auth.currentUser ? auth.currentUser.uid : '',
        month: monthString,
      };
      const docRef = await addDoc(collection(db, 'incomes'), newIncome);
      setIncomes((prev) => [...prev, { id: docRef.id, ...newIncome }]);
    } catch (error) {
      console.error('Error adding income row:', error);
    }
  };

  const addExpenseRow = async () => {
    try {
      const monthString = selectedMonth.toISOString().slice(0, 7);
      const newExpense: FinancialEntry = {
        category: 'New Expense',
        amount: '0',
        purpose: '',
        userId: auth.currentUser ? auth.currentUser.uid : '',
        month: monthString,
      };
      const docRef = await addDoc(collection(db, 'expenses'), newExpense);
      setExpenses((prev) => [...prev, { id: docRef.id, ...newExpense }]);
    } catch (error) {
      console.error('Error adding expense row:', error);
    }
  };

  // Delete a row
  const deleteIncomeRow = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'incomes', id));
      setIncomes((prev) => prev.filter((income) => income.id !== id));
    } catch (error) {
      console.error('Error deleting income row:', error);
    }
  };

  const deleteExpenseRow = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    } catch (error) {
      console.error('Error deleting expense row:', error);
    }
  };

  // Reset data for the selected month: delete existing documents for this month and create defaults
  const resetTables = async () => {
    try {
      const monthString = selectedMonth.toISOString().slice(0, 7);
      // Delete incomes for the current month
      const incomesQuery = query(
        collection(db, 'incomes'),
        where('userId', '==', auth.currentUser ? auth.currentUser.uid : ''),
        where('month', '==', monthString)
      );
      const incomesSnap = await getDocs(incomesQuery);
      for (const docSnap of incomesSnap.docs) {
        await deleteDoc(doc(db, 'incomes', docSnap.id));
      }

      // Delete expenses for the current month
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', auth.currentUser ? auth.currentUser.uid : ''),
        where('month', '==', monthString)
      );
      const expensesSnap = await getDocs(expensesQuery);
      for (const docSnap of expensesSnap.docs) {
        await deleteDoc(doc(db, 'expenses', docSnap.id));
      }

      showNotification('Data reset.', 'success');

      // Create default incomes for the current month
      const defaultIncomes = defaultIncomeCategories.map((category) => ({
        category,
        amount: '0',
        purpose: '',
        userId: auth.currentUser ? auth.currentUser.uid : '',
        month: monthString,
      }));
      const newIncomes: (FinancialEntry & { id: string })[] = [];
      for (const income of defaultIncomes) {
        const docRef = await addDoc(collection(db, 'incomes'), income);
        newIncomes.push({ id: docRef.id, ...income });
      }
      setIncomes(newIncomes);

      // Create default expenses for the current month
      const defaultExpenses = defaultExpenseCategories.map((category) => ({
        category,
        amount: '0',
        purpose: '',
        userId: auth.currentUser ? auth.currentUser.uid : '',
        month: monthString,
      }));
      const newExpenses: (FinancialEntry & { id: string })[] = [];
      for (const expense of defaultExpenses) {
        const docRef = await addDoc(collection(db, 'expenses'), expense);
        newExpenses.push({ id: docRef.id, ...expense });
      }
      setExpenses(newExpenses);
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  };

  // Export / Import
  const handleExport = () => {
    const data: BudgetData = { incomes, expenses };
    exportData(data, 'household_budget.json');
    showNotification('Data exported successfully.', 'success');
  };

  const handleImport = () => {
    importData((importedData: BudgetData) => {
      if (importedData.incomes && importedData.expenses) {
        setIncomes(importedData.incomes);
        setExpenses(importedData.expenses);
        showNotification('Data imported successfully.', 'success');
      } else {
        showNotification('Invalid data format.', 'error');
      }
    });
  };

  // Calculate summary values
  const { totalIncome, totalExpenses, balance } = calculateTotals();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-900">
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
        Household Budget Calculator
      </h1>

      {/* Month Picker using a calendar picker */}
      <div className="mb-4">
        <label htmlFor="monthSelect" className="text-white mr-2">
          Select Month:
        </label>
        <ReactDatePicker
          selected={selectedMonth}
          onChange={(date: Date | null) => date && setSelectedMonth(date)}
          dateFormat="yyyy-MM"
          showMonthYearPicker
          className="p-2 bg-gray-700 text-white rounded"
        />
      </div>

      {/* Notifications */}
      {notification.message && (
        <div
          className={`p-3 sm:p-4 rounded mb-4 ${
            notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Button Toolbar */}
      <div className="flex flex-col sm:flex-row justify-end mb-4 sm:mb-6 space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all data for the selected month?')) {
              resetTables();
            }
          }}
          className="bg-gray-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-gray-600 text-sm sm:text-base"
        >
          Reset
        </button>
        <button
          onClick={handleExport}
          className="bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-blue-600 text-sm sm:text-base"
        >
          Export
        </button>
        <button
          onClick={handleImport}
          className="bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-blue-600 text-sm sm:text-base"
        >
          Import
        </button>
      </div>

      {/* Incomes / Expenses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Incomes */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Income</h2>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            {incomes.map((entry) => (
              <div
                key={entry.id}
                className="mb-2 sm:mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2"
              >
                <input
                  type="text"
                  value={entry.category}
                  onChange={(e) => {
                    setIncomes((prev) =>
                      prev.map((income) =>
                        income.id === entry.id ? { ...income, category: e.target.value } : income
                      )
                    );
                    debouncedIncomeUpdate(entry.id, 'category', e.target.value);
                  }}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Category"
                />
                <input
                  type="text"
                  value={entry.amount}
                  onChange={(e) => {
                    setIncomes((prev) =>
                      prev.map((income) =>
                        income.id === entry.id ? { ...income, amount: e.target.value } : income
                      )
                    );
                    debouncedIncomeUpdate(entry.id, 'amount', e.target.value);
                  }}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={entry.purpose}
                  onChange={(e) => {
                    setIncomes((prev) =>
                      prev.map((income) =>
                        income.id === entry.id ? { ...income, purpose: e.target.value } : income
                      )
                    );
                    debouncedIncomeUpdate(entry.id, 'purpose', e.target.value);
                  }}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Purpose"
                />
                <button
                  onClick={() => deleteIncomeRow(entry.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded self-start"
                >
                  X
                </button>
              </div>
            ))}
            <button
              onClick={addIncomeRow}
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm"
            >
              + Add Income
            </button>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Expenses</h2>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            {expenses.map((entry) => (
              <div
                key={entry.id}
                className="mb-2 sm:mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2"
              >
                <input
                  type="text"
                  value={entry.category}
                  onChange={(e) => {
                    setExpenses((prev) =>
                      prev.map((expense) =>
                        expense.id === entry.id ? { ...expense, category: e.target.value } : expense
                      )
                    );
                    debouncedExpenseUpdate(entry.id, 'category', e.target.value);
                  }}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Category"
                />
                <input
                  type="text"
                  value={entry.amount}
                  onChange={(e) => {
                    setExpenses((prev) =>
                      prev.map((expense) =>
                        expense.id === entry.id ? { ...expense, amount: e.target.value } : expense
                      )
                    );
                    debouncedExpenseUpdate(entry.id, 'amount', e.target.value);
                  }}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={entry.purpose}
                  onChange={(e) => {
                    setExpenses((prev) =>
                      prev.map((expense) =>
                        expense.id === entry.id ? { ...expense, purpose: e.target.value } : expense
                      )
                    );
                    debouncedExpenseUpdate(entry.id, 'purpose', e.target.value);
                  }}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Purpose"
                />
                <button
                  onClick={() => deleteExpenseRow(entry.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded self-start"
                >
                  X
                </button>
              </div>
            ))}
            <button
              onClick={addExpenseRow}
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm"
            >
              + Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 sm:mt-6 bg-gray-800 rounded-lg p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-white">
          <div className="bg-gray-700 p-3 sm:p-4 rounded">
            <h3 className="text-base sm:text-lg font-semibold">Total Income</h3>
            <p className="text-xl sm:text-2xl font-bold">{totalIncome.toFixed(2)} $</p>
          </div>
          <div className="bg-gray-700 p-3 sm:p-4 rounded">
            <h3 className="text-base sm:text-lg font-semibold">Total Expenses</h3>
            <p className="text-xl sm:text-2xl font-bold">{totalExpenses.toFixed(2)} $</p>
          </div>
          <div className="bg-gray-700 p-3 sm:p-4 rounded">
            <h3 className="text-base sm:text-lg font-semibold">Balance</h3>
            <p
              className={`text-xl sm:text-2xl font-bold ${
                balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-white'
              }`}
            >
              {balance.toFixed(2)} $
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdBudgetCalculator;
