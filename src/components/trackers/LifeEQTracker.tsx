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

// 5 базовых категорий по умолчанию
const defaultCategories: Category[] = [
  { name: "Career", value: 7, tasks: [] },
  { name: "Health", value: 8, tasks: [] },
  { name: "Finance", value: 5, tasks: [] },
  { name: "Relationships", value: 7, tasks: [] },
  { name: "Family", value: 8, tasks: [] }
];

/** Возвращает строку предыдущего месяца в формате YYYY-MM */
const getPrevMonth = (monthStr: string): string => {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

const LifeEQTracker: React.FC = () => {
  // Текущий редактируемый месяц (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [chartDimension, setChartDimension] = useState({ width: 300, height: 300 });
  const [newTaskTexts, setNewTaskTexts] = useState<Record<string, string>>({});

  // Для аналитики
  const [comparisonMonth, setComparisonMonth] = useState<string>(() => getPrevMonth(new Date().toISOString().slice(0, 7)));
  const currentMonth = new Date().toISOString().slice(0, 7);

  const previousMonth = useMemo(() => getPrevMonth(selectedMonth), [selectedMonth]);

  /** Helpers */
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const withTasks = (cats: any): Category[] => (cats as any[]).map((c) => ({ ...c, tasks: Array.isArray(c.tasks) ? c.tasks : [] }));

  /** Load & persist */
  useEffect(() => {
    const key = `lifeEqCategories-${selectedMonth}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCategories(Array.isArray(parsed) && parsed.length ? withTasks(parsed) : defaultCategories);
      } catch {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem(`lifeEqCategories-${selectedMonth}`, JSON.stringify(categories));
  }, [categories, selectedMonth]);

  /** Responsive chart */
  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      setChartDimension({ width: w < 640 ? 280 : w < 768 ? 320 : 400, height: w < 640 ? 280 : w < 768 ? 320 : 400 });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  /** Category+Task helpers */
  const updateCategory = (name: string, fn: (c: Category) => Category) => setCategories((cs) => cs.map((c) => (c.name === name ? fn(c) : c)));

  const addNewCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { name: newCategory.trim(), value: 5, tasks: [] }]);
      setNewCategory("");
    }
  };

  const addTask = (catName: string) => {
    const text = newTaskTexts[catName]?.trim();
    if (!text) return;
    updateCategory(catName, (c) => ({ ...c, tasks: [...c.tasks, { id: generateId(), text, completed: false }] }));
    setNewTaskTexts((p) => ({ ...p, [catName]: "" }));
  };
  const toggleTask = (catName: string, taskId: string) => updateCategory(catName, (c) => ({ ...c, tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)) }));
  const removeTask = (catName: string, taskId: string) => updateCategory(catName, (c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }));

  /** Load helper (any month) */
  const loadCategoriesForMonth = (month: string): Category[] => {
    const stored = localStorage.getItem(`lifeEqCategories-${month}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) return withTasks(parsed);
      } catch {}
    }
    return defaultCategories;
  };

  /** Previous‑month data for diff on cards */
  const prevMonthCats = useMemo(() => loadCategoriesForMonth(previousMonth), [previousMonth]);

  /** Analytics */
  const comparisonData = loadCategoriesForMonth(comparisonMonth);
  const currentData = loadCategoriesForMonth(currentMonth);
  const differences = defaultCategories.map((cat) => {
    const currentCat = currentData.find((c) => c.name === cat.name);
    const compCat = comparisonData.find((c) => c.name === cat.name);
    return { name: cat.name, diff: (currentCat?.value ?? 0) - (compCat?.value ?? 0) };
  });

  return (
    <div className="w-full space-y-6 p-4">
      {/* Month selector */}
      <div className="flex justify-center items-center mb-4">
        <label className="mr-2 text-sm">Select Month (Editing):</label>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-800 p-2 rounded text-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="w-full bg-gray-700/50 rounded-lg p-4 flex justify-center items-center min-h-[300px] lg:min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={280}>
            <RadarChart data={categories}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: "12px", fontWeight: 500 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#9CA3AF" }} axisLine={{ strokeOpacity: 0.2 }} />
              <Radar name="Balance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Category panel */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Life Balance</h2>
            <div className="flex w-full sm:w-auto space-x-2">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New Category" className="flex-1 sm:flex-none bg-gray-800 p-2 rounded text-sm sm:text-base min-w-[150px]" />
              <button onClick={addNewCategory} className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const prev = prevMonthCats.find((c) => c.name === cat.name);
              const diff = cat.value - (prev?.value ?? 0);
              const diffColor = diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-gray-400";
              return (
                <div key={cat.name} className="bg-gray-700/50 p-4 rounded-lg space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm sm:text-base font-medium">{cat.name}</span>
                      {diff !== 0 && (
                        <span className={`flex items-center text-xs font-semibold ${diffColor}`}>
                          {diff > 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />} {Math.abs(diff)}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setCategories(categories.filter((c) => c.name !== cat.name))} className="p-1 hover:bg-gray-600 rounded group"><X className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" /></button>
                  </div>

                  {/* Slider */}
                  <input type="range" min="0" max="10" value={cat.value} onChange={(e) => updateCategory(cat.name, (c) => ({ ...c, value: parseInt(e.target.value) }))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs sm:text-sm text-gray-400 mt-1"><span>0</span><span className="font-medium">{cat.value}/10</span></div>

                  {/* Tasks */}
                  <div className="space-y-2 pt-2 max-h-40 overflow-y-auto pr-2 custom-scroll">
                    {cat.tasks.map((t) => (
                      <div key={t.id} className="flex items-start justify-between text-xs sm:text-sm bg-gray-800/70 rounded px-2 py-1">
                        <button className="mr-2 mt-0.5" onClick={() => toggleTask(cat.name, t.id)}>{t.completed ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-gray-400" />}</button>
                        <span className={`flex-1 ${t.completed ? "line-through text-gray-400" : ""}`}>{t.text}</span>
                        <button className="ml-2" onClick={() => removeTask(cat.name, t.id)}><X className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                      </div>
                    ))}
                  </div>

                  {/* Add task */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input type="text" value={newTaskTexts[cat.name] || ""} onChange={(e) => setNewTaskTexts({ ...newTaskTexts, [cat.name]: e.target.value })} placeholder="New Task" className="flex-1 bg-gray-800 p-1 rounded text-xs sm:text-sm" />
                    <button onClick={() => addTask(cat.name)} className="p-1 bg-blue-500 rounded hover:bg-blue-600 transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Analytics section */}
      <div className="mt-6">
        <h3 className="text-lg font-bold mb-4">Analytics Comparison</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Comparison month chart */}
          <div className="flex-1 bg-gray-700/50 rounded-lg p-4">
            <div className="mb-2 flex justify-between items-center">
              <span className="font-medium">Comparison Month</span>
              <input type="month" value={comparisonMonth} onChange={(e) => setComparisonMonth(e.target.value)} className="bg-gray-800 p-1 rounded text-sm" />
            </div>
            <ResponsiveContainer width="100%" height={chartDimension.height}>
              <RadarChart data={loadCategoriesForMonth(comparisonMonth)}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: "12px", fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#9CA3AF" }} axisLine={{ strokeOpacity: 0.2 }} />
                <Radar name="Balance" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Current month chart */}
          <div className="flex-1 bg-gray-700/50 rounded-lg p-4">
            <div className="mb-2 flex justify-between items-center"><span className="font-medium">Current Month</span><span className="text-sm bg-gray-800 p-1 rounded">{currentMonth}</span></div>
            <ResponsiveContainer width="100%" height={chartDimension.height}>
              <RadarChart data={loadCategoriesForMonth(currentMonth)}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: "12px", fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#9CA3AF" }} axisLine={{ strokeOpacity: 0.2 }} />
                <Radar name="Balance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Numeric diff */}
          <div className="w-full lg:w-1/3 bg-gray-800 rounded-lg p-4"><h4 className="font-medium mb-2">Difference</h4><div className="space-y-2">{differences.map((d) => (<div key={d.name} className="flex justify-between items-center"><span className="text-sm">{d.name}</span><div className="flex items-center space-x-1"><span className="text-sm">{d.diff}</span>{d.diff > 0 ? <ArrowUp className="w-4 h-4 text-green-500" /> : d.diff < 0 ? <ArrowDown className="w-4 h-4 text-red-500" /> : null}</div></div>))}</div></div>
        </div>
      </div>
    </div>
  );
};

export default LifeEQTracker;
  