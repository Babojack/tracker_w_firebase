import React, { useState, useEffect } from 'react';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';

interface Category {
  name: string;
  value: number;
}

// 5 базовых категорий по умолчанию
const defaultCategories: Category[] = [
  { name: 'Career', value: 7 },
  { name: 'Health', value: 8 },
  { name: 'Finance', value: 5 },
  { name: 'Relationships', value: 7 },
  { name: 'Family', value: 8 }
];

const LifeEQTracker: React.FC = () => {
  // Состояние для редактирования выбранного месяца (формат "YYYY-MM")
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  // Категории для выбранного месяца
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [chartDimension, setChartDimension] = useState({ width: 300, height: 300 });

  // Для аналитики: месяц сравнения (по умолчанию — предыдущий месяц)
  const [comparisonMonth, setComparisonMonth] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });
  // Текущий месяц для аналитики (определяется автоматически)
  const currentMonth = new Date().toISOString().slice(0, 7);

  // При изменении выбранного месяца для редактирования – загрузка данных из localStorage
  useEffect(() => {
    const key = `lifeEqCategories-${selectedMonth}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Если полученный массив не является массивом или он пустой, подставляем дефолтный набор
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setCategories(defaultCategories);
        } else {
          setCategories(parsed);
        }
      } catch (err) {
        console.error('Error parsing stored categories:', err);
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }
  }, [selectedMonth]);

  // Сохранение данных редактирования в localStorage
  useEffect(() => {
    const key = `lifeEqCategories-${selectedMonth}`;
    localStorage.setItem(key, JSON.stringify(categories));
  }, [categories, selectedMonth]);

  // Адаптация размеров графиков в зависимости от размера окна
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setChartDimension({ width: 280, height: 280 });
      } else if (width < 768) {
        setChartDimension({ width: 320, height: 320 });
      } else {
        setChartDimension({ width: 400, height: 400 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Функция добавления новой категории. Пользователь может добавить и больше, чем 5 (дефолт уже 5)
  const addNewCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { name: newCategory, value: 5 }]);
      setNewCategory('');
    }
  };

  // Функция загрузки категорий для заданного месяца (из localStorage или дефолт)
  const loadCategoriesForMonth = (month: string): Category[] => {
    const key = `lifeEqCategories-${month}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.error('Error parsing data for month', month, err);
      }
    }
    return defaultCategories;
  };

  // Данные для аналитики: сравнение выбранного месяца и текущего месяца
  const comparisonData = loadCategoriesForMonth(comparisonMonth);
  const currentData = loadCategoriesForMonth(currentMonth);

  // Расчёт разницы для каждой базовой категории (опираемся на defaultCategories)
  const differences = defaultCategories.map(cat => {
    const currentCat = currentData.find(c => c.name === cat.name);
    const compCat = comparisonData.find(c => c.name === cat.name);
    const currentVal = currentCat ? currentCat.value : 0;
    const compVal = compCat ? compCat.value : 0;
    const diff = currentVal - compVal;
    return { name: cat.name, diff, current: currentVal, comparison: compVal };
  });

  return (
    <div className="w-full space-y-6 p-4">
      {/* Секция редактирования: выбор месяца и редактирование данных */}
      <div className="flex justify-center items-center mb-4">
        <label className="mr-2 text-sm">Select Month (Editing):</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-gray-800 p-2 rounded text-sm"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Радиальный график для выбранного месяца */}
        <div className="w-full bg-gray-700/50 rounded-lg p-4 flex justify-center items-center min-h-[300px] lg:min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={280}>
            <RadarChart data={categories}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: '12px', fontWeight: 500 }}
              />
              <PolarRadiusAxis
                domain={[0, 10]}
                tick={{ fill: '#9CA3AF' }}
                axisLine={{ strokeOpacity: 0.2 }}
              />
              <Radar
                name="Balance"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Панель редактирования категорий */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Life Balance</h2>
            <div className="flex w-full sm:w-auto space-x-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New Category"
                className="flex-1 sm:flex-none bg-gray-800 p-2 rounded text-sm sm:text-base min-w-[150px]"
              />
              <button
                onClick={addNewCategory}
                className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((category, index) => (
              <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm sm:text-base font-medium">{category.name}</span>
                  <button
                    onClick={() =>
                      setCategories(categories.filter(c => c.name !== category.name))
                    }
                    className="p-1 hover:bg-gray-600 rounded group"
                  >
                    <X className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={category.value}
                  onChange={(e) =>
                    setCategories(categories.map(c =>
                      c.name === category.name ? { ...c, value: parseInt(e.target.value) } : c
                    ))
                  }
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs sm:text-sm text-gray-400 mt-1">
                  <span>0</span>
                  <span className="font-medium">{category.value}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Секция аналитики: сравнение двух периодов */}
      <div className="mt-6">
        <h3 className="text-lg font-bold mb-4">Analytics Comparison</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Блок для выбранного месяца сравнения */}
          <div className="flex-1 bg-gray-700/50 rounded-lg p-4">
            <div className="mb-2 flex justify-between items-center">
              <span className="font-medium">Comparison Month</span>
              <input 
                type="month" 
                value={comparisonMonth} 
                onChange={(e) => setComparisonMonth(e.target.value)} 
                className="bg-gray-800 p-1 rounded text-sm"
              />
            </div>
            <ResponsiveContainer width="100%" height={chartDimension.height}>
              <RadarChart data={loadCategoriesForMonth(comparisonMonth)}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fill: '#9CA3AF', fontSize: '12px', fontWeight: 500 }} 
                />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#9CA3AF' }} axisLine={{ strokeOpacity: 0.2 }}/>
                <Radar
                  name="Balance"
                  dataKey="value"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Блок для текущего месяца */}
          <div className="flex-1 bg-gray-700/50 rounded-lg p-4">
            <div className="mb-2 flex justify-between items-center">
              <span className="font-medium">Current Month</span>
              <span className="text-sm bg-gray-800 p-1 rounded">{currentMonth}</span>
            </div>
            <ResponsiveContainer width="100%" height={chartDimension.height}>
              <RadarChart data={loadCategoriesForMonth(currentMonth)}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fill: '#9CA3AF', fontSize: '12px', fontWeight: 500 }} 
                />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#9CA3AF' }} axisLine={{ strokeOpacity: 0.2 }}/>
                <Radar
                  name="Balance"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Блок числового сравнения (разница между месяцами) */}
          <div className="w-full lg:w-1/3 bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">Difference</h4>
            <div className="space-y-2">
              {differences.map(diff => (
                <div key={diff.name} className="flex justify-between items-center">
                  <span className="text-sm">{diff.name}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">{diff.diff}</span>
                    {diff.diff > 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    ) : diff.diff < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : null}
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
