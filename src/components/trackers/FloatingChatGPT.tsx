import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import jsPDF from 'jspdf';

// Интерфейс для сообщений чата
interface Message {
  sender: 'user' | 'system';
  text: string;
}

const FloatingChatGPT: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'system',
      text: 'Привет! Какой отчёт по аналитике ты хочешь сгенерировать? Выбери один из вариантов ниже: Mood, Project, Goals.',
    },
  ]);
  const [userInput, setUserInput] = useState('');

  // Функция для переключения видимости окна чата
  const toggleChat = () => setOpen(!open);

  // Добавление нового сообщения в чат
  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  // Функция генерации PDF-отчёта для Mood Tracker
  const handleGenerateMoodReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text('Mood Tracker Report', 20, 20);
    doc.setFontSize(16);
    doc.text('Detailed analytics from your MoodTracker', 20, 30);

    let moodData: any[] = [];
    const data = localStorage.getItem('moodTrackerData');
    if (data) {
      try {
        moodData = JSON.parse(data);
      } catch (err) {
        console.error('Error parsing mood data', err);
      }
    }
    if (moodData.length === 0) {
      moodData = [
        { date: '2025-04-10', mood: 'Happy', note: 'Had a great day!' },
        { date: '2025-04-11', mood: 'Sad', note: 'It was challenging.' },
      ];
    }

    let yOffset = 40;
    doc.setFontSize(12);
    moodData.forEach((record) => {
      const textLine = `${record.date}: ${record.mood} - ${record.note}`;
      doc.text(textLine, 20, yOffset);
      yOffset += 10;
      if (yOffset > 280) {
        doc.addPage();
        yOffset = 20;
      }
    });

    doc.save('mood-report.pdf');
    addMessage({ sender: 'system', text: 'Отчёт по Mood Tracker сгенерирован и сохранён.' });
    setOpen(false);
  };

  // Симуляция генерации Project Analytics
  const handleGenerateProjectReport = () => {
    addMessage({ sender: 'system', text: 'Генерирую аналитику по вашим проектам...' });
    // Здесь можно добавить получение и обработку данных трэкера проектов.
    setTimeout(() => {
      addMessage({
        sender: 'system',
        text: 'Project Analytics: Ваши проекты движутся в правильном направлении, однако стоит обратить внимание на распределение задач между участниками.',
      });
    }, 1000);
  };

  // Симуляция генерации Goals Analytics
  const handleGenerateGoalsReport = () => {
    addMessage({ sender: 'system', text: 'Генерирую аналитику по вашим целям...' });
    // Здесь можно добавить получение и обработку данных трэкера целей.
    setTimeout(() => {
      addMessage({
        sender: 'system',
        text: 'Goals Analytics: Вы достигли значительного прогресса, но возможно стоит пересмотреть приоритеты для оптимизации результатов.',
      });
    }, 1000);
  };

  // Определение доступных опций трэкеров
  const trackerOptions = [
    { id: 'mood', name: 'Mood Report', callback: handleGenerateMoodReport },
    { id: 'project', name: 'Project Report', callback: handleGenerateProjectReport },
    { id: 'goals', name: 'Goals Report', callback: handleGenerateGoalsReport },
  ];

  // Обработка пользовательского ввода команды
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    addMessage({ sender: 'user', text: userInput });
    const inputLower = userInput.trim().toLowerCase();

    if (inputLower.includes('mood')) {
      addMessage({ sender: 'system', text: 'Генерирую отчёт по Mood Tracker...' });
      handleGenerateMoodReport();
    } else if (inputLower.includes('project')) {
      addMessage({ sender: 'system', text: 'Генерирую аналитический отчёт по проектам...' });
      handleGenerateProjectReport();
    } else if (inputLower.includes('goal')) {
      addMessage({ sender: 'system', text: 'Генерирую отчёт по целям...' });
      handleGenerateGoalsReport();
    } else {
      addMessage({
        sender: 'system',
        text: 'Извини, я могу сгенерировать отчёты только для: Mood, Project и Goals.',
      });
    }
    setUserInput('');
  };

  return (
    <>
      {/* Плавающая иконка чата */}
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 bg-blue-600 p-3 rounded-full shadow-lg text-white hover:bg-blue-700"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Окно чата */}
      {open && (
        <div className="fixed bottom-20 right-5 bg-gray-800 p-4 rounded-lg shadow-lg text-white w-80">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold">Analytics Assistant</h4>
            <button onClick={toggleChat}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-40 overflow-y-auto mb-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span
                  className={`text-sm ${msg.sender === 'user' ? 'text-blue-400' : 'text-gray-300'}`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          
          {/* Блок с выбором трэкера */}
          <div className="flex flex-wrap gap-2 mb-2">
            {trackerOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  addMessage({ sender: 'user', text: option.name });
                  option.callback();
                }}
                className="bg-green-600 px-3 py-1 rounded hover:bg-green-700 text-sm"
              >
                {option.name}
              </button>
            ))}
          </div>

          <div className="flex">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 bg-gray-700 p-2 rounded-l text-sm outline-none"
              placeholder="Напиши команду..."
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 px-3 py-2 rounded-r hover:bg-blue-600 text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatGPT;
