import React, { useState, useEffect, ChangeEvent } from 'react';
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
//    1. Typen und Interfaces
// --------------------------------------------------------
interface FinancialEntry {
  category: string;
  amount: string;
  purpose: string;
  userId?: string;
}

interface BudgetData {
  incomes: (FinancialEntry & { id: string })[];
  expenses: (FinancialEntry & { id: string })[];
}

// Hilfsfunktion zum Parsen deutscher Zahlen (Komma als Dezimaltrenner)
function parseGermanFloat(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

// --------------------------------------------------------
//    2. Export- / Import-Funktionen
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
//    3. Hauptkomponente: HouseholdBudgetCalculator
// --------------------------------------------------------
const HouseholdBudgetCalculator: React.FC = () => {
  // Default-Kategorien
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

  // State für Incomes und Expenses (jedes Dokument hat eine eigene ID)
  const [incomes, setIncomes] = useState<(FinancialEntry & { id: string })[]>([]);
  const [expenses, setExpenses] = useState<(FinancialEntry & { id: string })[]>([]);

  // Notification-State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' }>({ message: '', type: 'success' });
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'success' }), 3000);
  };

  // Daten aus Firestore laden (nur Dokumente des aktuellen Users)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const incomesQuery = query(
          collection(db, 'incomes'),
          where('userId', '==', auth.currentUser ? auth.currentUser.uid : '')
        );
        const incomesSnap = await getDocs(incomesQuery);
        let loadedIncomes = incomesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (FinancialEntry & { id: string })[];
        if (loadedIncomes.length === 0) {
          const defaultIncomes = defaultIncomeCategories.map(category => ({
            category,
            amount: '0',
            purpose: '',
            userId: auth.currentUser ? auth.currentUser.uid : '',
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

      try {
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', auth.currentUser ? auth.currentUser.uid : '')
        );
        const expensesSnap = await getDocs(expensesQuery);
        let loadedExpenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (FinancialEntry & { id: string })[];
        if (loadedExpenses.length === 0) {
          const defaultExpenses = defaultExpenseCategories.map(category => ({
            category,
            amount: '0',
            purpose: '',
            userId: auth.currentUser ? auth.currentUser.uid : '',
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
  }, []);

  // Summen berechnen
  const calculateTotals = () => {
    const totalIncome = incomes.reduce((sum, entry) => sum + parseGermanFloat(entry.amount || '0'), 0);
    const totalExpenses = expenses.reduce((sum, entry) => sum + parseGermanFloat(entry.amount || '0'), 0);
    const balance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, balance };
  };

  // Update-Funktionen: Jeweils anhand der Dokument-ID
  const updateIncomeEntry = async (id: string, field: keyof FinancialEntry, value: string) => {
    try {
      await updateDoc(doc(db, 'incomes', id), { [field]: value });
      setIncomes(prev => prev.map(income => income.id === id ? { ...income, [field]: value } : income));
    } catch (error) {
      console.error('Error updating income entry:', error);
    }
  };

  const updateExpenseEntry = async (id: string, field: keyof FinancialEntry, value: string) => {
    try {
      await updateDoc(doc(db, 'expenses', id), { [field]: value });
      setExpenses(prev => prev.map(expense => expense.id === id ? { ...expense, [field]: value } : expense));
    } catch (error) {
      console.error('Error updating expense entry:', error);
    }
  };

  // Neue Zeile hinzufügen
  const addIncomeRow = async () => {
    try {
      const newIncome: FinancialEntry = {
        category: 'New Income',
        amount: '0',
        purpose: '',
        userId: auth.currentUser ? auth.currentUser.uid : '',
      };
      const docRef = await addDoc(collection(db, 'incomes'), newIncome);
      setIncomes(prev => [...prev, { id: docRef.id, ...newIncome }]);
    } catch (error) {
      console.error('Error adding income row:', error);
    }
  };

  const addExpenseRow = async () => {
    try {
      const newExpense: FinancialEntry = {
        category: 'New Expense',
        amount: '0',
        purpose: '',
        userId: auth.currentUser ? auth.currentUser.uid : '',
      };
      const docRef = await addDoc(collection(db, 'expenses'), newExpense);
      setExpenses(prev => [...prev, { id: docRef.id, ...newExpense }]);
    } catch (error) {
      console.error('Error adding expense row:', error);
    }
  };

  // Zeile löschen
  const deleteIncomeRow = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'incomes', id));
      setIncomes(prev => prev.filter(income => income.id !== id));
    } catch (error) {
      console.error('Error deleting income row:', error);
    }
  };

  const deleteExpenseRow = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error deleting expense row:', error);
    }
  };

  // Zusammenfassung berechnen
  const { totalIncome, totalExpenses, balance } = calculateTotals();

  // Auf Default zurücksetzen: Lösche alle Dokumente und lege Standardwerte an
  const resetTables = async () => {
    try {
      const incomesSnap = await getDocs(collection(db, 'incomes'));
      for (const docSnap of incomesSnap.docs) {
        await deleteDoc(doc(db, 'incomes', docSnap.id));
      }
      const expensesSnap = await getDocs(collection(db, 'expenses'));
      for (const docSnap of expensesSnap.docs) {
        await deleteDoc(doc(db, 'expenses', docSnap.id));
      }
      showNotification('Data reset.', 'success');

      const defaultIncomes = defaultIncomeCategories.map(category => ({
        category,
        amount: '0',
        purpose: '',
        userId: auth.currentUser ? auth.currentUser.uid : '',
      }));
      const newIncomes: (FinancialEntry & { id: string })[] = [];
      for (const income of defaultIncomes) {
        const docRef = await addDoc(collection(db, 'incomes'), income);
        newIncomes.push({ id: docRef.id, ...income });
      }
      setIncomes(newIncomes);

      const defaultExpenses = defaultExpenseCategories.map(category => ({
        category,
        amount: '0',
        purpose: '',
        userId: auth.currentUser ? auth.currentUser.uid : '',
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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-900">
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
        Household Budget Calculator
      </h1>

      {/* Notifications */}
      {notification.message && (
        <div className={`p-3 sm:p-4 rounded mb-4 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {notification.message}
        </div>
      )}

      {/* Button-Leiste */}
      <div className="flex flex-col sm:flex-row justify-end mb-4 sm:mb-6 space-y-2 sm:space-y-0 sm:space-x-2">
        <button onClick={() => { if (window.confirm('Are you sure you want to reset all data?')) { resetTables(); } }} className="bg-gray-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-gray-600 text-sm sm:text-base">
          Reset
        </button>
        <button onClick={handleExport} className="bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-blue-600 text-sm sm:text-base">
          Export
        </button>
        <button onClick={handleImport} className="bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-blue-600 text-sm sm:text-base">
          Import
        </button>
      </div>

      {/* Incomes / Expenses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Incomes */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">
            Income
          </h2>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            {incomes.map((entry) => (
              <div key={entry.id} className="mb-2 sm:mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={entry.category}
                  onChange={(e) => updateIncomeEntry(entry.id, 'category', e.target.value)}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Category"
                />
                <input
                  type="text"
                  value={entry.amount}
                  onChange={(e) => updateIncomeEntry(entry.id, 'amount', e.target.value)}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={entry.purpose}
                  onChange={(e) => updateIncomeEntry(entry.id, 'purpose', e.target.value)}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Purpose"
                />
                <button onClick={() => deleteIncomeRow(entry.id)} className="bg-red-500 text-white px-3 py-2 rounded self-start">
                  X
                </button>
              </div>
            ))}
            <button onClick={addIncomeRow} className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm">
              + Add Income
            </button>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">
            Expenses
          </h2>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            {expenses.map((entry) => (
              <div key={entry.id} className="mb-2 sm:mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={entry.category}
                  onChange={(e) => updateExpenseEntry(entry.id, 'category', e.target.value)}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Category"
                />
                <input
                  type="text"
                  value={entry.amount}
                  onChange={(e) => updateExpenseEntry(entry.id, 'amount', e.target.value)}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={entry.purpose}
                  onChange={(e) => updateExpenseEntry(entry.id, 'purpose', e.target.value)}
                  className="w-full sm:w-1/3 p-2 bg-gray-700 text-white rounded text-sm"
                  placeholder="Purpose"
                />
                <button onClick={() => deleteExpenseRow(entry.id)} className="bg-red-500 text-white px-3 py-2 rounded self-start">
                  X
                </button>
              </div>
            ))}
            <button onClick={addExpenseRow} className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm">
              + Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Zusammenfassung */}
      <div className="mt-4 sm:mt-6 bg-gray-800 rounded-lg p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">
          Summary
        </h2>
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
            <p className={`text-xl sm:text-2xl font-bold ${balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-white'}`}>
              {balance.toFixed(2)} $
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdBudgetCalculator;
