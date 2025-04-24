import React, { useState, useEffect, useMemo } from "react";
import { Plus, X, ArrowUp, ArrowDown, CheckSquare, Square } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from "recharts";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface Category {
  name: string;
  value: number;
  tasks: Task[];
}

const defaultCategories: Category[] = [
  { name: "Career", value: 7, tasks: [] },
  { name: "Health", value: 8, tasks: [] },
  { name: "Finance", value: 5, tasks: [] },
  { name: "Relationships", value: 7, tasks: [] },
  { name: "Family", value: 8, tasks: [] }
];

const withTasks = (cats: any): Category[] =>
  (cats as any[]).map((c) => ({ ...c, tasks: Array.isArray(c.tasks) ? c.tasks : [] }));

const getUserId = () => auth.currentUser?.uid ?? "demo";

const fetchCategories = async (month: string): Promise<Category[]> => {
  try {
    const ref = doc(db, "users", getUserId(), "lifeEqCategories", month);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { categories?: Category[] };
      if (Array.isArray(data.categories) && data.categories.length) return withTasks(data.categories);
    }
  } catch {}
  return defaultCategories;
};

const saveCategories = async (month: string, cats: Category[]) => {
  try {
    const ref = doc(db, "users", getUserId(), "lifeEqCategories", month);
    await setDoc(ref, { categories: cats }, { merge: true });
  } catch {}
};

const getPrevMonth = (monthStr: string) => {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

const LifeEQTracker: React.FC = () => {
  const today = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(today);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [newCategory, setNewCategory] = useState("");
  const [newTaskTexts, setNewTaskTexts] = useState<Record<string, string>>({});
  const [chartDimension, setChartDimension] = useState({ width: 300, height: 300 });

  const previousMonth = useMemo(() => getPrevMonth(selectedMonth), [selectedMonth]);
  const [prevCats, setPrevCats] = useState<Category[]>(defaultCategories);
  const [comparisonMonth, setComparisonMonth] = useState<string>(() => getPrevMonth(today));
  const [compCats, setCompCats] = useState<Category[]>(defaultCategories);
  const [currCats, setCurrCats] = useState<Category[]>(defaultCategories);

  useEffect(() => {
    let active = true;
    fetchCategories(selectedMonth).then((cats) => active && setCategories(cats));
    return () => {
      active = false;
    };
  }, [selectedMonth]);

  useEffect(() => {
    const id = setTimeout(() => saveCategories(selectedMonth, categories), 400);
    return () => clearTimeout(id);
  }, [categories, selectedMonth]);

  useEffect(() => {
    fetchCategories(previousMonth).then(setPrevCats);
  }, [previousMonth]);

  useEffect(() => {
    fetchCategories(comparisonMonth).then(setCompCats);
  }, [comparisonMonth]);

  useEffect(() => {
    fetchCategories(today).then(setCurrCats);
  }, [today]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setChartDimension({ width: w < 640 ? 280 : w < 768 ? 320 : 400, height: w < 640 ? 280 : w < 768 ? 320 : 400 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const updateCategory = (name: string, fn: (c: Category) => Category) => setCategories((cs) => cs.map((c) => (c.name === name ? fn(c) : c)));

  const addNewCategory = () => {
    const txt = newCategory.trim();
    if (!txt) return;
    setCategories([...categories, { name: txt, value: 5, tasks: [] }]);
    setNewCategory("");
  };

  const addTask = (catName: string) => {
    const txt = newTaskTexts[catName]?.trim();
    if (!txt) return;
    updateCategory(catName, (c) => ({ ...c, tasks: [...c.tasks, { id: generateId(), text: txt, completed: false }] }));
    setNewTaskTexts((m) => ({ ...m, [catName]: "" }));
  };

  const toggleTask = (catName: string, id: string) => updateCategory(catName, (c) => ({ ...c, tasks: c.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)) }));
  const removeTask = (catName: string, id: string) => updateCategory(catName, (c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== id) }));

  const diffs = defaultCategories.map((d) => {
    const a = currCats.find((c) => c.name === d.name)?.value ?? 0;
    const b = compCats.find((c) => c.name === d.name)?.value ?? 0;
    return { name: d.name, diff: a - b };
  });

  return (
    <div className="w-full space-y-6 p-4">
      <div className="flex justify-center items-center mb-4">
        <label className="mr-2 text-sm">Select Month (Editing):</label>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-800 p-2 rounded text-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-700/50 rounded-lg p-4 flex justify-center items-center min-h-[300px] lg:min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={280}>
            <RadarChart data={categories}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#9CA3AF" }} axisLine={{ strokeOpacity: 0.2 }} />
              <Radar name="Balance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Life Balance</h2>
            <div className="flex flex-col w-full sm:w-auto space-y-2">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New Category" className="bg-gray-800 p-2 rounded text-sm sm:text-base min-w-[150px]" />
              <button onClick={addNewCategory} className="self-start bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const prev = prevCats.find((c) => c.name === cat.name)?.value ?? 0;
              const delta = cat.value - prev;
              const col = delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-gray-400";
              return (
                <div key={cat.name} className="bg-gray-700/50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm sm:text-base font-medium">{cat.name}</span>
                      {delta !== 0 && (
                        <span className={`flex items-center text-xs font-semibold ${col}`}>
                          {delta > 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                          {Math.abs(delta)}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setCategories(categories.filter((c) => c.name !== cat.name))} className="p-1 hover:bg-gray-600 rounded">
                      <X className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  </div>

                  <input type="range" min={0} max={10} value={cat.value} onChange={(e) => updateCategory(cat.name, (c) => ({ ...c, value: +e.target.value }))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #3b82f6 ${cat.value * 10}%, #4b5563 ${cat.value * 10}%)` }} />
                  <div className="flex justify-between text-xs sm:text-sm text-gray-400 mt-1">
                    <span>0</span>
                    <span className="font-medium">{cat.value}/10</span>
                  </div>

                  <div className="space-y-2 pt-2 max-h-40 overflow-y-auto pr-2 custom-scroll">
                    {cat.tasks.map((t) => (
                      <div key={t.id} className="flex items-start justify-between text-xs sm:text-sm bg-gray-800/70 rounded px-2 py-1">
                        <button onClick={() => toggleTask(cat.name, t.id)} className="mr-2 mt-0.5">
                          {t.completed ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-gray-400" />}
                        </button>
                        <span className={t.completed ? "line-through text-gray-400" : ""}>{t.text}</span>
                        <button onClick={() => removeTask(cat.name, t.id)} className="ml-2">
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col space-y-2 pt-1">
                    <input type="text" value={newTaskTexts[cat.name] || ""} onChange={(e) => setNewTaskTexts((m) => ({ ...m, [cat.name]: e.target.value }))} placeholder="New Task" className="bg-gray-800 p-2 rounded text-xs sm:text-sm" />
                    <button onClick={() => addTask(cat.name)} className="self-start bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-bold">Analytics Comparison</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Comparison Month</span>
              <input type="month" value={comparisonMonth} onChange={(e) => setComparisonMonth(e.target.value)} className="bg-gray-800 p-1 rounded text-sm" />
            </div>
            <ResponsiveContainer width="100%" height={chartDimension.height}>
              <RadarChart data={compCats}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#9CA3AF" }} axisLine={{ strokeOpacity: 0.2 }} />
                <Radar name="Balance" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 bg-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Current Month</span>
              <span className="bg-gray-800 p-1 rounded text-sm">{today}</span>
            </div>
            <ResponsiveContainer width="100%" height={chartDimension.height}>
              <RadarChart data={currCats}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#9CA3AF" }} axisLine={{ strokeOpacity: 0.2 }} />
                <Radar name="Balance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-1/3 bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">Difference</h4>
            <div className="space-y-2">
              {diffs.map((d) => (
                <div key={d.name} className="flex justify-between items-center">
                  <span className="text-sm">{d.name}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">{d.diff}</span>
                    {d.diff > 0 ? <ArrowUp className="w-4 h-4 text-green-500" /> : d.diff < 0 ? <ArrowDown className="w-4 h-4 text-red-500" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeEQTracker;

