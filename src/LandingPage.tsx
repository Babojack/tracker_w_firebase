// src/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './flipcard.css';
import {
  Activity,
  Target,
  BarChart2,
  Brain,
  Plus,
  Calculator,
  Gift,
  Plane,
  ShoppingCart,
  User,
  Box,
  BarChart3,
  Clock,
  CheckCircle2,
  BookOpenCheck,
  BedDouble,
} from 'lucide-react';

const modules = [
  { title: 'Project Tracker',  description: 'Organize projects & milestones.',       icon: <Activity size={32} />,  gif: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' },
  { title: 'Goals Tracker',    description: 'Set and achieve measurable goals.',     icon: <Target size={32} />,    gif: 'https://media.giphy.com/media/26gsl03QLUS4lnwOM/giphy.gif' },
  { title: 'Mood Tracker',     description: 'Log mood & spot emotional patterns.',  icon: <BarChart2 size={32} />, gif: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif' },
  { title: 'LifeEQ Tracker',   description: 'Keep overall life balance in check.',  icon: <Brain size={32} />,     gif: 'https://media.giphy.com/media/3orieWfIgbngFYwV8k/giphy.gif' },
  { title: "ToDo's Tracker",   description: 'Tame your task list & beat chaos.',     icon: <Plus size={32} />,      gif: 'https://media.giphy.com/media/10SvWCbt1ytWCc/giphy.gif' },
  { title: 'Household Budget', description: 'Track income, expenses & balance.',    icon: <Calculator size={32} />,gif: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif' },
  { title: 'Wishlist Tracker', description: 'Plan purchases & stay motivated.',     icon: <Gift size={32} />,      gif: 'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif' },
  { title: 'Travel Planner',   description: 'Plan trips stress‑free & on budget.',  icon: <Plane size={32} />,     gif: 'https://media.giphy.com/media/3oEjHP8ELRNNlnlLGM/giphy.gif' },
  { title: 'Shopping List',    description: 'Never forget an item again.',          icon: <ShoppingCart size={32} />,gif:'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif' },
];

const stats = [
  { icon: <User size={40} className="text-blue-400" />, value: '100K+', label: 'Neurodiverse Users' },
  { icon: <Box size={40} className="text-blue-400" />, value: '9',      label: 'Integrated Trackers' },
  { icon: <BarChart3 size={40} className="text-blue-400" />, value: '24/7', label: 'Cloud Sync' },
];

const testimonials = [
  { quote: 'MyTracker finally gave my ADHD brain structure without killing creativity!', author: 'Alice, Designer' },
  { quote: 'The daily focus timer keeps me on track every single hour.', author: 'Ben, Developer' },
  { quote: 'Mood analytics helped me notice burnout weeks before it hit.', author: 'Clara, Writer' },
];

const timeline = [
  { time: '07:00', title: 'Morning Snapshot',   desc: 'Quick mood log & review today’s goals.',          icon: <Clock size={20}/> },
  { time: '09:00', title: 'Deep‑Work Block',    desc: 'Start Focus Timer in Project Tracker.',           icon: <BookOpenCheck size={20}/> },
  { time: '12:30', title: 'Lunch & Reflect',    desc: 'Update Mood, tick completed tasks.',             icon: <CheckCircle2 size={20}/> },
  { time: '15:00', title: 'Budget Check‑in',    desc: 'Log any expenses, update balance.',              icon: <Calculator size={20}/> },
  { time: '18:00', title: 'Evening Wind‑Down',  desc: 'Review progress & plan tomorrow.',              icon: <Target size={20}/> },
  { time: '22:30', title: 'Sleep & Sync',       desc: 'All data auto‑syncs. Time to rest.',             icon: <BedDouble size={20}/> },
];

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.2 } } };
const fadeInUp           = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const LandingPage: React.FC = () => (
  <motion.div initial="hidden" animate="show" variants={containerVariants} className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-white">

    <motion.section variants={fadeInUp} className="text-center py-20 px-4">
      <h1 className="text-5xl font-bold mb-4">Built for <span className="text-blue-500">brains that bounce</span></h1>
      <p className="text-xl max-w-2xl mx-auto text-gray-300 mb-8">
        One unified dashboard for focus, finances, feelings — designed with ADHD & Autistic brains in mind.
      </p>
      <Link to="/signup" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full font-semibold hover:from-purple-700 hover:to-blue-600">
        Try it Free
      </Link>
    </motion.section>

    {/* Why MyTracker */}
    <motion.section variants={fadeInUp} className="bg-gray-800/50 py-12 px-4">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-3xl font-bold mb-4">Why MyTracker?</h2>
          <ul className="list-disc list-inside space-y-3 text-gray-300">
            <li><b>Zero context‑switching.</b> All life‑areas live in one clean screen.</li>
            <li><b>Brain‑friendly UI.</b> Big buttons, calm colors, no information overload.</li>
            <li><b>Instant dopamine hits.</b> Micro‑rewards & colourful progress bars.</li>
            <li><b>Data that helps.</b> Mood heatmaps, budget trends, project burndown.</li>
            <li><b>Built by neurodiverse devs.</b> We use these tools every day ourselves.</li>
          </ul>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-6">
          <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Clock size={24}/> Daily Flow (24‑hour guide)</h3>
          <ol className="space-y-3">
            {timeline.map(step => (
              <li key={step.time} className="flex items-start gap-3">
                <span className="text-purple-400 w-14">{step.time}</span>
                <span className="text-purple-300">{step.icon}</span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </motion.section>

    {/* Stats */}
    <motion.section variants={fadeInUp} className="py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {stats.map((s, i) => (
          <motion.div key={i} variants={fadeInUp} className="flex flex-col items-center">
            {s.icon}
            <span className="text-3xl font-bold mt-2">{s.value}</span>
            <span className="text-gray-400">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.section>

    {/* Core trackers flip cards */}
    <motion.section variants={fadeInUp} className="bg-gray-800/40 py-12 px-4">
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h2 className="text-3xl font-bold">Core Trackers</h2>
        <p className="text-gray-400">Nine modules, one brain‑saving workspace.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {modules.map((mod, idx) => (
          <div key={idx} className="flip-card h-64">
            <div className="flip-card-inner">
              <div className="flip-card-front p-6 bg-gray-700/50 rounded-lg flex flex-col items-center justify-center text-center">
                {mod.icon}
                <h3 className="text-xl font-semibold mt-4">{mod.title}</h3>
              </div>
              <div className="flip-card-back p-6 bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center">
                <p className="text-gray-300 mb-4">{mod.description}</p>
                <img src={mod.gif} alt={`${mod.title} GIF`} className="max-h-32 rounded-lg shadow-lg" loading="lazy" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>

    {/* Testimonials */}
    <motion.section variants={fadeInUp} className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h2 className="text-3xl font-bold">Real users. Real results.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.blockquote key={i} variants={fadeInUp} className="bg-gray-800/50 p-6 rounded-lg">
            <p className="italic text-gray-200">“{t.quote}”</p>
            <footer className="mt-4 text-sm text-gray-400">— {t.author}</footer>
          </motion.blockquote>
        ))}
      </div>
    </motion.section>

    {/* Final CTA */}
    <motion.section variants={fadeInUp} className="text-center py-12 px-4">
      <h2 className="text-2xl font-bold mb-4">Start your focus journey today</h2>
      <Link to="/signup" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full font-semibold hover:from-purple-700 hover:to-blue-600">
        Create Your Free Account
      </Link>
    </motion.section>

    <motion.footer variants={fadeInUp} className="p-6 text-center bg-gray-900 text-gray-400">
      <p>© 2025 MyTracker — Designed by neurodiverse devs for neurodiverse minds.</p>
    </motion.footer>
  </motion.div>
);

export default LandingPage;
