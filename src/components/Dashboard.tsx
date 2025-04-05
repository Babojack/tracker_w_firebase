// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,    // иконка для Project Tracker
  Target,      // иконка для Goals Tracker
  BarChart2,   // иконка для Mood Tracker
  Brain,       // иконка для LifeEQ Tracker
  Plus,        // иконка для ToDo Tracker
  Calculator,  // иконка для Household Budget
  Gift         // иконка для Wunschliste
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const Dashboard: React.FC = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return <div>No user logged in.</div>;

  // -------------------------------
  // Состояния для статистики (реальные данные)
  // -------------------------------
  const [projectStats, setProjectStats] = useState({ total: 0, done: 0, inProgress: 0 });
  const [goalStats, setGoalStats] = useState({ total: 0, done: 0, inProgress: 0 });
  const [moodStats, setMoodStats] = useState({ total: 0, weeklyTrendEmoji: 'N/A', averageMood: 0 });
  const [lifeEQCount, setLifeEQCount] = useState(0);
  const [todoStats, setTodoStats] = useState({ total: 0, active: 0, completed: 0 });
  const [budgetStats, setBudgetStats] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [wishlistStats, setWishlistStats] = useState({ total: 0, totalCost: 0 });

  // -------------------------------
  // Вспомогательная функция: преобразование строки в число (если используется запятая)
  // -------------------------------
  const parseAmount = (value: string): number =>
    parseFloat(value.replace(',', '.'));

  // -------------------------------
  // Подписки на Firestore (реальное обновление данных)
  // -------------------------------
  useEffect(() => {
    // PROJECT TRACKER – коллекция "projectTrackerGoals"
    const qProjects = query(
      collection(db, 'projectTrackerGoals'),
      where('userId', '==', uid)
    );
    const unsubscribeProjects = onSnapshot(qProjects, snapshot => {
      let done = 0, inProgress = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'Done') done++;
        else if (data.status === 'In Progress') inProgress++;
      });
      setProjectStats({ total: snapshot.size, done, inProgress });
    });

    // GOALS TRACKER – коллекция "goalsTracker"
    const qGoals = query(
      collection(db, 'goalsTracker'),
      where('userId', '==', uid)
    );
    const unsubscribeGoals = onSnapshot(qGoals, snapshot => {
      let done = 0, inProgress = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'Done') done++;
        else if (data.status === 'In Progress') inProgress++;
      });
      setGoalStats({ total: snapshot.size, done, inProgress });
    });

    // MOOD TRACKER – коллекция "moodEntries"
    // Подписка для общего количества записей
    const qMoodTotal = query(
      collection(db, 'moodEntries'),
      where('userId', '==', uid)
    );
    const unsubscribeMoodTotal = onSnapshot(qMoodTotal, snapshot => {
      setMoodStats(prev => ({ ...prev, total: snapshot.size }));
    });
    // Отдельно вычисляем недельный тренд (записи за последние 7 дней)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const qMoodWeekly = query(
      collection(db, 'moodEntries'),
      where('userId', '==', uid),
      where('timestamp', '>=', oneWeekAgo.toISOString())
    );
    getDocs(qMoodWeekly).then(snapshot => {
      let sumMood = 0, count = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.mood && typeof data.mood.id === 'number') {
          sumMood += data.mood.id;
          count++;
        }
      });
      const averageMood = count > 0 ? sumMood / count : 0;
      let weeklyTrendEmoji = 'N/A';
      if (averageMood >= 4.5) weeklyTrendEmoji = '😃';
      else if (averageMood >= 3.5) weeklyTrendEmoji = '🙂';
      else if (averageMood >= 2.5) weeklyTrendEmoji = '😐';
      else if (averageMood >= 1.5) weeklyTrendEmoji = '🙁';
      else if (averageMood > 0) weeklyTrendEmoji = '😞';
      setMoodStats(prev => ({
        ...prev,
        weeklyTrendEmoji,
        averageMood: Number(averageMood.toFixed(1))
      }));
    });

    // LIFE EQ TRACKER – коллекция "lifeEQEntries"
    const qLifeEQ = query(
      collection(db, 'lifeEQEntries'),
      where('userId', '==', uid)
    );
    const unsubscribeLifeEQ = onSnapshot(qLifeEQ, snapshot => {
      setLifeEQCount(snapshot.size);
    });

    // TODO TRACKER – коллекция "todoGroups"
    const qTodos = query(
      collection(db, 'todoGroups'),
      where('userId', '==', uid)
    );
    const unsubscribeTodos = onSnapshot(qTodos, snapshot => {
      let total = 0, active = 0, completed = 0;
      snapshot.forEach(doc => {
        total++;
        const data = doc.data();
        if (Array.isArray(data.todos)) {
          data.todos.forEach((todo: any) => {
            if (todo.completed) completed++;
            else active++;
          });
        }
      });
      setTodoStats({ total, active, completed });
    });

    // HOUSEHOLD BUDGET – сбор данных из коллекций "incomes" и "expenses"
    const qIncomes = query(
      collection(db, 'incomes'),
      where('userId', '==', uid)
    );
    const unsubscribeIncomes = onSnapshot(qIncomes, snapshot => {
      let totalIncome = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        totalIncome += parseAmount(data.amount || '0');
      });
      setBudgetStats(prev => ({
        ...prev,
        totalIncome,
        balance: totalIncome - prev.totalExpenses
      }));
    });
    const qExpenses = query(
      collection(db, 'expenses'),
      where('userId', '==', uid)
    );
    const unsubscribeExpenses = onSnapshot(qExpenses, snapshot => {
      let totalExpenses = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        totalExpenses += parseAmount(data.amount || '0');
      });
      setBudgetStats(prev => ({
        ...prev,
        totalExpenses,
        balance: prev.totalIncome - totalExpenses
      }));
    });

    // WISHLIST – коллекция "wishlist"
    const qWishlist = query(
      collection(db, 'wishlist'),
      where('userId', '==', uid)
    );
    const unsubscribeWishlist = onSnapshot(qWishlist, snapshot => {
      let total = snapshot.size;
      let totalCost = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        totalCost += parseAmount(data.price || '0');
      });
      setWishlistStats({ total, totalCost });
    });

    // Очистка подписок при размонтировании компонента
    return () => {
      unsubscribeProjects();
      unsubscribeGoals();
      unsubscribeMoodTotal();
      unsubscribeLifeEQ();
      unsubscribeTodos();
      unsubscribeIncomes();
      unsubscribeExpenses();
      unsubscribeWishlist();
    };
  }, [uid]);

  // -------------------------------
  // Формирование карточек с данными для отображения
  // -------------------------------
  const cards = [
    {
      title: 'Project Tracker',
      description: 'Manage your projects efficiently.',
      icon: <Activity size={32} />,
      tab: 'projects',
      stat: `Total: ${projectStats.total} projects. Completed: ${projectStats.done}. In Progress: ${projectStats.inProgress}.`
    },
    {
      title: 'Goals Tracker',
      description: 'Set and achieve your goals.',
      icon: <Target size={32} />,
      tab: 'goals',
      stat: `Total: ${goalStats.total} goals. Completed: ${goalStats.done}. In Progress: ${goalStats.inProgress}.`
    },
    {
      title: 'Mood Tracker',
      description: 'Monitor your weekly mood trend.',
      icon: <BarChart2 size={32} />,
      tab: 'mood',
      stat: `Weekly Trend: ${moodStats.weeklyTrendEmoji} (Avg: ${moodStats.averageMood}) from ${moodStats.total} entries.`
    },
    {
      title: 'LifeEQ Tracker',
      description: 'Assess your overall life balance.',
      icon: <Brain size={32} />,
      tab: 'lifeEQ',
      stat: `Total Entries: ${lifeEQCount}.`
    },
    {
      title: "ToDo's",
      description: 'Keep track of your tasks.',
      icon: <Plus size={32} />,
      tab: 'todos',
      stat: `Total Tasks: ${todoStats.total}. Active: ${todoStats.active}. Completed: ${todoStats.completed}.`
    },
    {
      title: 'Household Budget',
      description: 'Monitor your incomes and expenses.',
      icon: <Calculator size={32} />,
      tab: 'budget',
      stat: `Income: $${budgetStats.totalIncome.toFixed(2)}. Expenses: $${budgetStats.totalExpenses.toFixed(2)}. Balance: $${budgetStats.balance.toFixed(2)}.`
    },
    {
      title: 'Wishlist',
      description: 'Review your wishes and estimated costs.',
      icon: <Gift size={32} />,
      tab: 'wishlist',
      stat: `Total Wishes: ${wishlistStats.total}. Estimated Cost: $${wishlistStats.totalCost.toFixed(2)}.`
    },
  ];

  // -------------------------------
  // Рендеринг карточек Dashboard
  // -------------------------------
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link
            key={card.tab}
            to={`/?tab=${card.tab}`}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg flex flex-col items-center text-center transition-colors"
          >
            <div className="mb-3">{card.icon}</div>
            <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
            <p className="text-sm text-gray-400 mb-2">{card.description}</p>
            <div className="mt-auto">
              <span className="text-sm">{card.stat}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
