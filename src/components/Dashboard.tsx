// Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,   // для ProjectTracker
  Target,     // для GoalsTracker
  BarChart2,  // для MoodTracker
  Brain,      // для LifeEQTracker
  Plus,       // для ToDo
  Calculator, // для Household Budget
  Gift        // для Wunschliste
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const Dashboard: React.FC = () => {
  const uid = auth.currentUser?.uid;

  // Состояния для статистики (будут обновляться в реальном времени)
  const [projectStats, setProjectStats] = useState({ done: 0, inProgress: 0, notStarted: 0 });
  const [goalStats, setGoalStats] = useState({ done: 0, inProgress: 0, notStarted: 0 });
  const [moodCount, setMoodCount] = useState(0);
  const [lifeEQCount, setLifeEQCount] = useState(0);
  const [todoStats, setTodoStats] = useState({ active: 0, completed: 0 });
  const [budgetTotal, setBudgetTotal] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (!uid) return;

    // Подписка на изменения в коллекции "projectTrackerGoals"
    const qProjects = query(collection(db, 'projectTrackerGoals'), where('userId', '==', uid));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      let done = 0, inProgress = 0, notStarted = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'Done') done++;
        else if (data.status === 'In Progress') inProgress++;
        else notStarted++;
      });
      setProjectStats({ done, inProgress, notStarted });
    });

    // Подписка на коллекцию "goalsTracker"
    const qGoals = query(collection(db, 'goalsTracker'), where('userId', '==', uid));
    const unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
      let done = 0, inProgress = 0, notStarted = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'Done') done++;
        else if (data.status === 'In Progress') inProgress++;
        else notStarted++;
      });
      setGoalStats({ done, inProgress, notStarted });
    });

    // Подписка на Mood Tracker: коллекция "moodEntries"
    const qMood = query(collection(db, 'moodEntries'), where('userId', '==', uid));
    const unsubscribeMood = onSnapshot(qMood, (snapshot) => {
      setMoodCount(snapshot.size);
    });

    // Подписка на LifeEQ Tracker: коллекция "lifeEQEntries"
    const qLifeEQ = query(collection(db, 'lifeEQEntries'), where('userId', '==', uid));
    const unsubscribeLifeEQ = onSnapshot(qLifeEQ, (snapshot) => {
      setLifeEQCount(snapshot.size);
    });

    // Подписка на ToDo Tracker: коллекция "todoGroups"
    const qTodos = query(collection(db, 'todoGroups'), where('userId', '==', uid));
    const unsubscribeTodos = onSnapshot(qTodos, (snapshot) => {
      let active = 0, completed = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.todos)) {
          data.todos.forEach((todo: any) => {
            if (todo.completed) completed++;
            else active++;
          });
        }
      });
      setTodoStats({ active, completed });
    });

    // Подписка на Household Budget: коллекция "householdBudget"
    const qBudget = query(collection(db, 'householdBudget'), where('userId', '==', uid));
    const unsubscribeBudget = onSnapshot(qBudget, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += Number(data.amount) || 0;
      });
      setBudgetTotal(total);
    });

    // Подписка на Wunschliste: коллекция "wishlist"
    const qWishlist = query(collection(db, 'wishlist'), where('userId', '==', uid));
    const unsubscribeWishlist = onSnapshot(qWishlist, (snapshot) => {
      setWishlistCount(snapshot.size);
    });

    // Отписываемся от всех слушателей при размонтировании
    return () => {
      unsubscribeProjects();
      unsubscribeGoals();
      unsubscribeMood();
      unsubscribeLifeEQ();
      unsubscribeTodos();
      unsubscribeBudget();
      unsubscribeWishlist();
    };

  }, [uid]);

  // Формирование карточек с реальными данными
  const cards = [
    {
      title: 'Project Tracker',
      description: 'Управляй своими проектами',
      icon: <Activity size={32} />,
      tab: 'projects',
      stat: `${projectStats.done + projectStats.inProgress + projectStats.notStarted} проектов (Выполнено: ${projectStats.done}, В процессе: ${projectStats.inProgress})`
    },
    {
      title: 'Goals Tracker',
      description: 'Ставь и достигай цели',
      icon: <Target size={32} />,
      tab: 'goals',
      stat: `${goalStats.done + goalStats.inProgress + goalStats.notStarted} целей (Выполнено: ${goalStats.done}, В процессе: ${goalStats.inProgress})`
    },
    {
      title: 'Mood Tracker',
      description: 'Отслеживай настроение',
      icon: <BarChart2 size={32} />,
      tab: 'mood',
      stat: `${moodCount} записей`
    },
    {
      title: 'LifeEQ Tracker',
      description: 'Радар сбалансированной жизни',
      icon: <Brain size={32} />,
      tab: 'lifeEQ',
      stat: `${lifeEQCount} записей`
    },
    {
      title: "ToDo's",
      description: 'Задачи и заметки',
      icon: <Plus size={32} />,
      tab: 'todos',
      stat: `${todoStats.active + todoStats.completed} задач (Активных: ${todoStats.active})`
    },
    {
      title: 'Household Budget',
      description: 'Веди бюджет и расходы',
      icon: <Calculator size={32} />,
      tab: 'budget',
      stat: `Общий расход: ${budgetTotal}`
    },
    {
      title: 'Wunschliste',
      description: 'Список желаний и покупок',
      icon: <Gift size={32} />,
      tab: 'wishlist',
      stat: `${wishlistCount} желаний`
    },
  ];

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
