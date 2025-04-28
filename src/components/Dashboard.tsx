// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Target,
  BarChart2,
  Brain,
  Plus,
  Calculator,
  Gift,
  BookOpenCheck,
  Clock,
  Film,
  ShoppingCart,
  Plane
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import {
  collection,
  collectionGroup,
  query,
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

interface StatCard {
  title: string;
  description: string;
  icon: JSX.Element;
  link: string;
  content: JSX.Element;
}

const Dashboard: React.FC = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return <div>Kein Benutzer angemeldet.</div>;

  // -------------------------------
  // States für Statistiken
  // -------------------------------
  const [projectStats, setProjectStats] = useState({ total: 0, done: 0, inProgress: 0 });
  const [goalStats, setGoalStats] = useState({ total: 0, done: 0, inProgress: 0 });
  const [moodStats, setMoodStats] = useState({ total: 0, weeklyTrendEmoji: 'N/A', averageMood: 0 });
  const [moodTrendData, setMoodTrendData] = useState<{ date: string; value: number }[]>([]);
  const [lifeEQCount, setLifeEQCount] = useState(0);
  const [todoStats, setTodoStats] = useState({ total: 0, active: 0, completed: 0 });
  const [budgetStats, setBudgetStats] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [wishlistStats, setWishlistStats] = useState({ total: 0, totalCost: 0 });

  // Neue Tracker
  const [bookCount, setBookCount] = useState(0);
  const [dailyFlowCount, setDailyFlowCount] = useState(0);
  const [movieCount, setMovieCount] = useState(0);
  const [shoppingListCount, setShoppingListCount] = useState(0);
  const [travelCount, setTravelCount] = useState(0);

  const parseAmount = (value: string): number =>
    parseFloat(value.replace(',', '.'));

  useEffect(() => {
    // PROJECT TRACKER
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

    // GOALS TRACKER (uses same 'projectGoals' collection)
    const qGoals = query(
      collection(db, 'projectGoals'),
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

    // MOOD TRACKER – Gesamtanzahl
    const qMoodAll = query(
      collection(db, 'moodEntries'),
      where('userId', '==', uid)
    );
    const unsubscribeMoodAll = onSnapshot(qMoodAll, snapshot => {
      setMoodStats(prev => ({ ...prev, total: snapshot.size }));
    });

    // MOOD TRACKER – Wöchentlicher Trend (requires composite index)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const qMoodWeekly = query(
      collection(db, 'moodEntries'),
      where('userId', '==', uid),
      where('timestamp', '>=', oneWeekAgo.toISOString())
    );
    getDocs(qMoodWeekly).then(snapshot => {
      const moodByDay: Record<string, { sum: number; count: number }> = {};
      let sumMood = 0, count = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const id = data.mood?.id || 0;
        const dateKey = data.timestamp.split('T')[0];
        if (!moodByDay[dateKey]) moodByDay[dateKey] = { sum: 0, count: 0 };
        moodByDay[dateKey].sum += id;
        moodByDay[dateKey].count++;
        sumMood += id;
        count++;
      });
      const trend = Object.entries(moodByDay)
        .map(([date, { sum, count }]) => ({ date, value: Number((sum / count).toFixed(1)) }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setMoodTrendData(trend);
      const avg = count ? sumMood / count : 0;
      let emoji = 'N/A';
      if (avg >= 4.5) emoji = '😃';
      else if (avg >= 3.5) emoji = '🙂';
      else if (avg >= 2.5) emoji = '😐';
      else if (avg >= 1.5) emoji = '🙁';
      else if (avg > 0) emoji = '😞';
      setMoodStats(prev => ({ ...prev, weeklyTrendEmoji: emoji, averageMood: Number(avg.toFixed(1)) }));
    });

    // LIFE EQ – collectionGroup on subcollection 'lifeEqCategories'
    const qLifeEQ = query(
      collectionGroup(db, 'lifeEqCategories'),
      where('userId', '==', uid)
    );
    const unsubscribeLifeEQ = onSnapshot(qLifeEQ, snapshot => {
      setLifeEQCount(snapshot.size);
    });

    // TODO TRACKER
    const qTodos = query(
      collection(db, 'todoGroups'),
      where('userId', '==', uid)
    );
    const unsubscribeTodos = onSnapshot(qTodos, snapshot => {
      let total = 0, active = 0, completed = 0;
      snapshot.forEach(doc => {
        total++;
        const data: any = doc.data();
        data.todos?.forEach((t: any) => t.completed ? completed++ : active++);
      });
      setTodoStats({ total, active, completed });
    });

    // BUDGET
    const qInc = query(collection(db, 'incomes'), where('userId', '==', uid));
    const unsubscribeInc = onSnapshot(qInc, snap => {
      let inc = 0;
      snap.forEach(doc => { inc += parseAmount(doc.data().amount||'0'); });
      setBudgetStats(prev => ({ ...prev, totalIncome: inc, balance: inc - prev.totalExpenses }));
    });
    const qExp = query(collection(db, 'expenses'), where('userId', '==', uid));
    const unsubscribeExp = onSnapshot(qExp, snap => {
      let exp = 0;
      snap.forEach(doc => { exp += parseAmount(doc.data().amount||'0'); });
      setBudgetStats(prev => ({ ...prev, totalExpenses: exp, balance: prev.totalIncome - exp }));
    });

    // WISHLIST
    const qWish = query(collection(db, 'wishlist'), where('userId', '==', uid));
    const unsubscribeWish = onSnapshot(qWish, snap => {
      let cost = 0;
      snap.forEach(doc => cost += parseAmount(doc.data().price||'0'));
      setWishlistStats({ total: snap.size, totalCost: cost });
    });

    // BOOK TRACKER
    const qBooks = query(collection(db, 'booksRead'), where('userId','==',uid));
    const unsubscribeBooks = onSnapshot(qBooks, snap => setBookCount(snap.size));

    // DAILY FLOW (heutige Schritte)
    const today = new Date().toISOString().slice(0,10);
    const qDaily = query(collection(db,'dailyFlows'), where('userId','==',uid), where('date','==',today));
    const unsubscribeDaily = onSnapshot(qDaily, snap => setDailyFlowCount(snap.size));

    // MOVIE WISHLIST
    const qMovies = query(collection(db,'movieWishlist'), where('userId','==',uid));
    const unsubscribeMovies = onSnapshot(qMovies, snap => setMovieCount(snap.size));

    // SHOPPING LIST TRACKER
    const qShopping = query(collection(db,'shoppingLists'), where('userId','==',uid));
    const unsubscribeShopping = onSnapshot(qShopping, snap => setShoppingListCount(snap.size));

    // TRAVEL PLANNER
    const qTrips = query(collection(db,'travelTrips'), where('userId','==',uid));
    const unsubscribeTrips = onSnapshot(qTrips, snap => setTravelCount(snap.size));

    // Cleanup
    return () => {
      unsubscribeProjects(); unsubscribeGoals(); unsubscribeMoodAll(); unsubscribeLifeEQ(); unsubscribeTodos();
      unsubscribeInc(); unsubscribeExp(); unsubscribeWish();
      unsubscribeBooks(); unsubscribeDaily(); unsubscribeMovies(); unsubscribeShopping(); unsubscribeTrips();
    };
  }, [uid]);

  // -------------------------------
  // Karten für Dashboard
  // -------------------------------
  const cards: StatCard[] = [
    {
      title: 'Project Tracker',
      description: 'Manage your projects efficiently.',
      icon: <Activity size={32} />,      
      link: '/projects',
      content: (
        <>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-blue-500" style={{ width: `${projectStats.total ? (projectStats.done/projectStats.total)*100 : 0}%` }} />
          </div>
          <p className="text-sm">{projectStats.done}/{projectStats.total} Completed</p>
        </>
      ),
    },
    {
      title: 'Goals Tracker',
      description: 'Set and achieve your goals.',
      icon: <Target size={32} />,      
      link: '/goals',
      content: (
        <>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-green-500" style={{ width: `${goalStats.total ? (goalStats.done/goalStats.total)*100 : 0}%` }} />
          </div>
          <p className="text-sm">{goalStats.done}/{goalStats.total} Completed</p>
        </>
      ),
    },
    {
      title: 'Mood Tracker',
      description: 'Monitor your weekly mood.',
      icon: <BarChart2 size={32} />,      
      link: '/mood',
      content: (
        <>
          <div className="w-full h-16 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodTrendData}>
                <Line type="monotone" dataKey="value" dot={false} stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm">Avg: {moodStats.averageMood} {moodStats.weeklyTrendEmoji} ({moodStats.total})</p>
        </>
      ),
    },
    {
      title: 'LifeEQ Tracker',
      description: 'Assess your life balance.',
      icon: <Brain size={32} />,      
      link: '/life-eq',
      content: <p className="text-sm">Entries: {lifeEQCount}</p>,
    },
    {
      title: "ToDo's",
      description: 'Track your tasks.',
      icon: <Plus size={32} />,      
      link: '/todos',
      content: (
        <>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-purple-500" style={{ width: `${todoStats.total ? (todoStats.completed/todoStats.total)*100 : 0}%` }} />
          </div>
          <p className="text-sm">{todoStats.completed}/{todoStats.total} Done</p>
        </>
      ),
    },
    {
      title: 'Household Budget',
      description: 'Monitor incomes & expenses.',
      icon: <Calculator size={32} />,      
      link: '/budget',
      content: (
        <>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-red-500" style={{ width: `${budgetStats.totalIncome ? (budgetStats.totalExpenses/budgetStats.totalIncome)*100 : 0}%` }} />
          </div>
          <p className="text-sm">Spent: ${budgetStats.totalExpenses.toFixed(2)} / ${budgetStats.totalIncome.toFixed(2)}</p>
        </>
      ),
    },
    {
      title: 'Wishlist',
      description: 'Review your wishes.',
      icon: <Gift size={32} />,      
      link: '/wishlist',
      content: <p className="text-sm">{wishlistStats.total} items – ${wishlistStats.totalCost.toFixed(2)}</p>,
    },
    // Neue Tracker Karten
    {
      title: 'Book Tracker',
      description: 'Keep track of your reading.',
      icon: <BookOpenCheck size={32} />,      
      link: '/books',
      content: <p className="text-sm">{bookCount} books</p>,
    },
    {
      title: 'Daily Flow',
      description: 'Plan your daily steps.',
      icon: <Clock size={32} />,      
      link: '/daily-flow',
      content: <p className="text-sm">{dailyFlowCount} steps today</p>,
    },
    {
      title: 'Movie Wishlist',
      description: 'Movies to watch.',
      icon: <Film size={32} />,      
      link: '/movies',
      content: <p className="text-sm">{movieCount} movies</p>,
    },
    {
      title: 'Shopping Lists',
      description: 'Manage your shopping lists.',
      icon: <ShoppingCart size={32} />,      
      link: '/shopping-lists',
      content: <p className="text-sm">{shoppingListCount} lists</p>,
    },
    {
      title: 'Travel Planner',
      description: 'Plan your trips.',
      icon: <Plane size={32} />,      
      link: '/travel',
      content: <p className="text-sm">{travelCount} trips</p>,
    }
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map(card => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg flex flex-col items-center text-center transition-colors"
          >
            <div className="mb-3">{card.icon}</div>
            <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
            <p className="text-sm text-gray-400 mb-3">{card.description}</p>
            <div className="w-full">{card.content}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
