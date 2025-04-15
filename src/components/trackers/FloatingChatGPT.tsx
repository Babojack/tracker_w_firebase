import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import jsPDF from 'jspdf';

interface Message {
  sender: 'user' | 'system';
  text: string;
}

const FloatingChatGPT: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'system', text: 'Hi! What analytics report would you like to generate? You can type a command or select an option below.' }
  ]);
  const [userInput, setUserInput] = useState("");

  const toggleChat = () => setOpen(!open);

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  // Функция генерации красивого PDF отчёта с данными из MoodTracker
  const handleGenerateMoodReport = () => {
    const doc = new jsPDF();

    // Заголовок и подзаголовок
    doc.setFontSize(22);
    doc.text("Mood Tracker Report", 20, 20);
    doc.setFontSize(16);
    doc.text("Detailed analytics from your MoodTracker", 20, 30);

    // Получаем данные из localStorage по ключу "moodTrackerData"
    let moodData: any[] = [];
    const data = localStorage.getItem("moodTrackerData");
    if (data) {
      try {
        moodData = JSON.parse(data);
      } catch (err) {
        console.error("Error parsing mood data", err);
      }
    }
    // Если данных нет, подставляем примерные
    if (moodData.length === 0) {
      moodData = [
        { date: "2025-04-10", mood: "Happy", note: "Had a great day!" },
        { date: "2025-04-11", mood: "Sad", note: "It was challenging." }
      ];
    }

    // Выводим данные построчно
    let yOffset = 40;
    doc.setFontSize(12);
    moodData.forEach((record, index) => {
      const textLine = `${record.date}: ${record.mood} - ${record.note}`;
      doc.text(textLine, 20, yOffset);
      yOffset += 10;
      // Если достигли нижней границы страницы, создаём новую
      if (yOffset > 280) {
        doc.addPage();
        yOffset = 20;
      }
    });

    // Дополнительное оформление можно добавить здесь (например, линии, таблицы, графику)
    doc.save("mood-report.pdf");
    addMessage({ sender: 'system', text: "Mood Tracker Report generated and downloaded." });
    setOpen(false);
  };

  // Обработка текста, введённого пользователем
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    addMessage({ sender: 'user', text: userInput });
    // Простейшая обработка команд – если сообщение содержит слово "mood", запускается отчёт
    if (userInput.toLowerCase().includes("mood")) {
      addMessage({ sender: 'system', text: "Generating Mood Tracker Report..." });
      handleGenerateMoodReport();
    } else {
      addMessage({ sender: 'system', text: "I'm sorry, I can currently generate only the Mood Tracker Report." });
    }
    setUserInput("");
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
              <div key={index} className={`mb-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`text-sm ${msg.sender === 'user' ? 'text-blue-400' : 'text-gray-300'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="mb-2">
            {/* Готовая кнопка для выбора отчёта по настроению */}
            <button
              onClick={() => {
                addMessage({ sender: 'user', text: "Generate Mood Report" });
                addMessage({ sender: 'system', text: "Generating Mood Tracker Report..." });
                handleGenerateMoodReport();
              }}
              className="bg-green-600 px-3 py-1 rounded hover:bg-green-700 mr-2 text-sm"
            >
              Mood Report
            </button>
          </div>
          <div className="flex">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }}
              className="flex-1 bg-gray-700 p-2 rounded-l text-sm outline-none"
              placeholder="Type a command..."
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