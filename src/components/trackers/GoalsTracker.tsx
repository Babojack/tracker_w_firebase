import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Star, Archive } from 'lucide-react';
import Note from '../shared/Note';
import Milestone from '../shared/Milestone';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from './../../firebaseConfig'; // Stelle sicher, dass auth hier ebenfalls exportiert wird

// Typdefinitionen – Firestore-Dokument-IDs als Strings
interface MilestoneType {
  id: string;
  name: string;
  completed: boolean;
}

interface NoteType {
  id: string;
  text: string;
  timestamp: string;
}

interface Goal {
  id: string;
  userId: string; // neu hinzugefügt
  name: string;
  deadline: string;
  status: string;
  image: string | null;
  difficulty: number;
  milestones: MilestoneType[];
  notes: NoteType[];
  order: number;
  archived: boolean;
  favorite: boolean;
}

type SortOption = 'default' | 'alphabet' | 'date' | 'difficulty';

interface DifficultyIndicatorProps {
  value: number;
  onChange: (newValue: number) => void;
}

const DifficultyIndicator: React.FC<DifficultyIndicatorProps> = ({ value, onChange }) => {
  const circles = [1, 2, 3, 4, 5, 6];
  const getColor = (index: number) => {
    if (index > value) return 'bg-gray-300';
    if (index <= 2) return 'bg-green-500';
    if (index <= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex space-x-1">
      {circles.map((circle) => (
        <button
          key={circle}
          onClick={() => onChange(circle)}
          className={`w-6 h-6 rounded-full ${getColor(circle)} border border-gray-500`}
          title={`Priority Level ${circle}`}
        />
      ))}
    </div>
  );
};

const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [draggedGoalId, setDraggedGoalId] = useState<string | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Beim Mounten: Goals aus Firestore laden, gefiltert nach dem aktuellen User
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        // Filtere nach userId, die dem aktuell angemeldeten Nutzer entspricht
        const q = query(
          collection(db, "projectGoals"),
          where('userId', '==', auth.currentUser?.uid || '')
        );
        const querySnapshot = await getDocs(q);
        const fetchedGoals: Goal[] = [];
        querySnapshot.forEach((document) => {
          fetchedGoals.push({ id: document.id, ...document.data() } as Goal);
        });
        setGoals(fetchedGoals);
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };

    fetchGoals();
  }, []);

  const getActiveGoals = () => goals.filter(g => !g.archived);
  const getArchivedGoals = () => goals.filter(g => g.archived);

  const sortGoals = (list: Goal[]) => {
    const sorted = [...list];
    switch (sortBy) {
      case 'alphabet':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'date':
        return sorted.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      case 'difficulty':
        return sorted.sort((a, b) => b.difficulty - a.difficulty);
      default:
        return sorted.sort((a, b) => a.order - b.order);
    }
  };

  const updateGoalStatus = (goal: Goal) => {
    const hasStarted = goal.milestones.some(m => m.completed);
    const allCompleted = goal.milestones.every(m => m.completed);
    return allCompleted ? 'Done' : (hasStarted ? 'In Progress' : 'Not Started');
  };

  const handleImageUpload = (goalId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setGoals(currentGoals =>
          currentGoals.map(g =>
            g.id === goalId ? { ...g, image: base64Image } : g
          )
        );
        try {
          const goalRef = doc(db, "projectGoals", goalId);
          await updateDoc(goalRef, { image: base64Image });
        } catch (error) {
          console.error("Error updating image:", error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addNote = async (goalId: string, noteText: string) => {
    const newNote: NoteType = {
      id: Date.now().toString(),
      text: noteText,
      timestamp: new Date().toISOString()
    };

    const updatedGoals = goals.map(g =>
      g.id === goalId ? { ...g, notes: [newNote, ...g.notes] } : g
    );
    setGoals(updatedGoals);

    try {
      const goalRef = doc(db, "projectGoals", goalId);
      const goalToUpdate = updatedGoals.find(g => g.id === goalId);
      if (goalToUpdate) {
        await updateDoc(goalRef, { notes: goalToUpdate.notes });
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const addNewGoal = async () => {
    const newGoal = {
      userId: auth.currentUser?.uid || '', // neu hinzugefügt
      name: 'New Goal',
      deadline: new Date().toISOString(),
      status: 'Not Started',
      image: null,
      difficulty: 3,
      milestones: [] as MilestoneType[],
      notes: [] as NoteType[],
      order: goals.length + 1,
      archived: false,
      favorite: false
    };

    try {
      const docRef = await addDoc(collection(db, "projectGoals"), newGoal);
      setGoals([...goals, { id: docRef.id, ...newGoal }]);
    } catch (error) {
      console.error("Error adding new goal:", error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await deleteDoc(doc(db, "projectGoals", goalId));
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const toggleArchiveGoal = async (goalId: string) => {
    const updatedGoals = goals.map(g =>
      g.id === goalId ? { ...g, archived: !g.archived } : g
    );
    setGoals(updatedGoals);
    try {
      const goalRef = doc(db, "projectGoals", goalId);
      const goalToUpdate = updatedGoals.find(g => g.id === goalId);
      if (goalToUpdate) {
        await updateDoc(goalRef, { archived: goalToUpdate.archived });
      }
    } catch (error) {
      console.error("Error toggling archive:", error);
    }
  };

  const toggleFavoriteGoal = async (goalId: string) => {
    const updatedGoals = goals.map(g =>
      g.id === goalId ? { ...g, favorite: !g.favorite } : g
    );
    setGoals(updatedGoals);
    try {
      const goalRef = doc(db, "projectGoals", goalId);
      const goalToUpdate = updatedGoals.find(g => g.id === goalId);
      if (goalToUpdate) {
        await updateDoc(goalRef, { favorite: goalToUpdate.favorite });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Drag & Drop Logik
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, goalId: string, node: HTMLDivElement) => {
    dragStartPosition.current = { x: e.clientX, y: e.clientY };
    dragNodeRef.current = node;
    setDraggedGoalId(goalId);
    setIsDragging(true);
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.4';
      }
    }, 0);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', goalId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, goalId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedGoalId === goalId) return;
    setDragOverGoalId(goalId);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, goalId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedGoalId === goalId) return;
    setDragOverGoalId(goalId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGoalId(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetGoalId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    if (draggedGoalId === null || draggedGoalId === targetGoalId) {
      setIsDragging(false);
      setDraggedGoalId(null);
      setDragOverGoalId(null);
      return;
    }
    const activeGoals = getActiveGoals();
    const draggedGoalIndex = activeGoals.findIndex(g => g.id === draggedGoalId);
    const targetGoalIndex = activeGoals.findIndex(g => g.id === targetGoalId);
    if (draggedGoalIndex < 0 || targetGoalIndex < 0) {
      setIsDragging(false);
      setDraggedGoalId(null);
      setDragOverGoalId(null);
      return;
    }
    const newActiveGoals = [...activeGoals];
    const [removed] = newActiveGoals.splice(draggedGoalIndex, 1);
    newActiveGoals.splice(targetGoalIndex, 0, removed);
    newActiveGoals.forEach((goal, idx) => {
      goal.order = idx + 1;
    });
    // Aktualisiere die Reihenfolge in Firestore
    for (const goal of newActiveGoals) {
      try {
        await updateDoc(doc(db, "projectGoals", goal.id), { order: goal.order });
      } catch (error) {
        console.error("Error updating order:", error);
      }
    }
    const archivedGoals = getArchivedGoals();
    setGoals([...newActiveGoals, ...archivedGoals]);
    setIsDragging(false);
    setDraggedGoalId(null);
    setDragOverGoalId(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setIsDragging(false);
    setDraggedGoalId(null);
    setDragOverGoalId(null);
    dragNodeRef.current = null;
  };

  const activeGoals = sortGoals(getActiveGoals());
  const archivedGoals = getArchivedGoals();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Goals Tracker</h2>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-gray-800 text-white p-2 rounded text-sm"
          >
            <option value="default">Default</option>
            <option value="alphabet">Alphabetical</option>
            <option value="date">By Date</option>
            <option value="difficulty">By Priority</option>
          </select>
          <button
            onClick={addNewGoal}
            className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            aria-label="Add new goal"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {activeGoals.map(goal => {
          const progress = goal.milestones.length
            ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100)
            : 0;

          const isDragged = draggedGoalId === goal.id;
          const isDraggedOver = dragOverGoalId === goal.id;

          return (
            <div
              key={goal.id}
              className={`bg-gray-700/50 p-3 sm:p-4 rounded-lg flex flex-col transition-all duration-200
                ${isDragged ? 'opacity-50' : 'opacity-100'}
                ${isDraggedOver ? 'border-2 border-blue-500 scale-105' : 'border border-transparent'}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, goal.id, e.currentTarget)}
              onDragOver={(e) => handleDragOver(e, goal.id)}
              onDragEnter={(e) => handleDragEnter(e, goal.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, goal.id)}
              onDragEnd={handleDragEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div className="relative mb-3 sm:mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(goal.id, e)}
                  className="hidden"
                  id={`goal-${goal.id}`}
                />
                <label htmlFor={`goal-${goal.id}`} className="cursor-pointer block">
                  {goal.image ? (
                    <img
                      src={goal.image}
                      alt="Goal"
                      className="w-full h-24 sm:h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-24 sm:h-32 bg-gray-800 rounded flex items-center justify-center">
                      <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                  )}
                </label>
              </div>

              <div className="flex flex-col mb-3">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={goal.name}
                    onChange={async (e) => {
                      const updatedName = e.target.value;
                      setGoals(goals.map(g => g.id === goal.id ? { ...g, name: updatedName } : g));
                      try {
                        const goalRef = doc(db, "projectGoals", goal.id);
                        await updateDoc(goalRef, { name: updatedName });
                      } catch (error) {
                        console.error("Error updating goal name:", error);
                      }
                    }}
                    className="bg-transparent font-semibold text-sm sm:text-base outline-none max-w-full"
                  />
                </div>

                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs px-1 py-1 rounded bg-gray-800 whitespace-nowrap">
                    {goal.status}
                  </span>

                  <div className="flex items-center">
                    <button
                      onClick={() => toggleFavoriteGoal(goal.id)}
                      className={`p-1 hover:bg-gray-600 rounded ${goal.favorite ? 'text-yellow-400' : ''}`}
                      title="Toggle Favorite"
                      aria-label="Toggle favorite"
                    >
                      <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => toggleArchiveGoal(goal.id)}
                      className="p-1 hover:bg-gray-600 rounded"
                      title="Toggle Archive"
                      aria-label="Toggle archive"
                    >
                      <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this goal?")) {
                          deleteGoal(goal.id);
                        }
                      }}
                      className="p-1 hover:bg-gray-600 rounded"
                      aria-label="Delete goal"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <span className="block text-xs sm:text-sm font-semibold mb-1">Priority</span>
                <DifficultyIndicator
                  value={goal.difficulty}
                  onChange={(newVal) => {
                    setGoals(goals.map(g => g.id === goal.id ? { ...g, difficulty: newVal } : g));
                    updateDoc(doc(db, "projectGoals", goal.id), { difficulty: newVal }).catch(error => {
                      console.error("Error updating difficulty:", error);
                    });
                  }}
                />
              </div>

              <div className="mb-3">
                <span className="block text-xs sm:text-sm font-semibold mb-1">Progress</span>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-xs">{progress}%</span>
              </div>

              <div className="mb-3">
                <label className="text-xs sm:text-sm font-semibold block mb-1">Deadline</label>
                <input
                  type="date"
                  value={goal.deadline.split('T')[0]}
                  onChange={async (e) => {
                    const newDeadline = new Date(e.target.value).toISOString();
                    setGoals(goals.map(g => g.id === goal.id ? { ...g, deadline: newDeadline } : g));
                    try {
                      const goalRef = doc(db, "projectGoals", goal.id);
                      await updateDoc(goalRef, { deadline: newDeadline });
                    } catch (error) {
                      console.error("Error updating deadline:", error);
                    }
                  }}
                  className="w-full bg-gray-800 rounded p-2 text-sm"
                />
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm font-semibold">Tasks</h3>
                  <button
                    onClick={async () => {
                      const updatedMilestones = [
                        ...goal.milestones,
                        { id: Date.now().toString(), name: 'New Task', completed: false }
                      ];
                      setGoals(goals.map(g => g.id === goal.id ? { ...g, milestones: updatedMilestones } : g));
                      try {
                        const goalRef = doc(db, "projectGoals", goal.id);
                        await updateDoc(goalRef, { milestones: updatedMilestones });
                      } catch (error) {
                        console.error("Error adding task:", error);
                      }
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                    aria-label="Add task"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="max-h-28 sm:max-h-32 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {goal.milestones.map(milestone => (
                    <Milestone
                      key={milestone.id}
                      milestone={milestone}
                      onToggle={async () => {
                        const updatedMilestones = goal.milestones.map(m =>
                          m.id === milestone.id ? { ...m, completed: !m.completed } : m
                        );
                        const updatedGoal = { ...goal, milestones: updatedMilestones, status: updateGoalStatus({ ...goal, milestones: updatedMilestones }) };
                        setGoals(goals.map(g => g.id === goal.id ? updatedGoal : g));
                        try {
                          const goalRef = doc(db, "projectGoals", goal.id);
                          await updateDoc(goalRef, { milestones: updatedMilestones, status: updatedGoal.status });
                        } catch (error) {
                          console.error("Error toggling milestone:", error);
                        }
                      }}
                      onUpdate={async (name) => {
                        const updatedMilestones = goal.milestones.map(m =>
                          m.id === milestone.id ? { ...m, name } : m
                        );
                        setGoals(goals.map(g => g.id === goal.id ? { ...g, milestones: updatedMilestones } : g));
                        try {
                          const goalRef = doc(db, "projectGoals", goal.id);
                          await updateDoc(goalRef, { milestones: updatedMilestones });
                        } catch (error) {
                          console.error("Error updating milestone:", error);
                        }
                      }}
                      onDelete={async () => {
                        const updatedMilestones = goal.milestones.filter(m => m.id !== milestone.id);
                        setGoals(goals.map(g => g.id === goal.id ? { ...g, milestones: updatedMilestones } : g));
                        try {
                          const goalRef = doc(db, "projectGoals", goal.id);
                          await updateDoc(goalRef, { milestones: updatedMilestones });
                        } catch (error) {
                          console.error("Error deleting milestone:", error);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[120px]">
                <input
                  type="text"
                  placeholder="Comments"
                  className="w-full bg-gray-800 rounded p-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                      addNote(goal.id, (e.target as HTMLInputElement).value.trim());
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <div className="flex-1 max-h-28 sm:max-h-32 overflow-y-auto space-y-2 mt-2 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {goal.notes.map(note => (
                    <Note
                      key={note.id}
                      note={note}
                      onDelete={async () => {
                        const updatedNotes = goal.notes.filter(n => n.id !== note.id);
                        setGoals(goals.map(g => g.id === goal.id ? { ...g, notes: updatedNotes } : g));
                        try {
                          const goalRef = doc(db, "projectGoals", goal.id);
                          await updateDoc(goalRef, { notes: updatedNotes });
                        } catch (error) {
                          console.error("Error deleting note:", error);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {archivedGoals.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Archived Goals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {archivedGoals.map(goal => {
              const progress = goal.milestones.length
                ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100)
                : 0;
              return (
                <div
                  key={goal.id}
                  className="bg-gray-700/50 p-3 sm:p-4 rounded-lg flex flex-col opacity-70"
                >
                  <div className="relative mb-3 sm:mb-4">
                    {goal.image ? (
                      <img
                        src={goal.image}
                        alt="Goal"
                        className="w-full h-24 sm:h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-24 sm:h-32 bg-gray-800 rounded flex items-center justify-center">
                        <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col mb-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm sm:text-base">
                        {goal.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs px-1 py-1 rounded bg-gray-800 whitespace-nowrap">
                        {goal.status}
                      </span>
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleArchiveGoal(goal.id)}
                          className="p-1 hover:bg-gray-600 rounded"
                          title="Toggle Archive"
                          aria-label="Toggle archive"
                        >
                          <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this goal?")) {
                              deleteGoal(goal.id);
                            }
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                          aria-label="Delete goal"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="block text-xs sm:text-sm font-semibold mb-1">Priority</span>
                    <DifficultyIndicator
                      value={goal.difficulty}
                      onChange={(newVal) => {
                        setGoals(goals.map(g => g.id === goal.id ? { ...g, difficulty: newVal } : g));
                        updateDoc(doc(db, "projectGoals", goal.id), { difficulty: newVal }).catch(error => {
                          console.error("Error updating difficulty:", error);
                        });
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <span className="block text-xs sm:text-sm font-semibold mb-1">Progress</span>
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs">{progress}%</span>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs sm:text-sm font-semibold block mb-1">Deadline</label>
                    <input
                      type="date"
                      value={goal.deadline.split('T')[0]}
                      onChange={async (e) => {
                        const newDeadline = new Date(e.target.value).toISOString();
                        setGoals(goals.map(g => g.id === goal.id ? { ...g, deadline: newDeadline } : g));
                        try {
                          const goalRef = doc(db, "projectGoals", goal.id);
                          await updateDoc(goalRef, { deadline: newDeadline });
                        } catch (error) {
                          console.error("Error updating deadline:", error);
                        }
                      }}
                      className="w-full bg-gray-800 rounded p-2 text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTracker;
