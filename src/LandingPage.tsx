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

const screenshots = [
  {
    src: '1.png',
    alt: 'Project Tracker Screenshot',
    title: 'Project Tracker',
    description: 'Project Tracker helps you structure your ideas into clear steps, set milestones, and visualize progress in boards or timelines. From app launches to personal goals — everything stays organized and moving forward.',
  },
  {
    src: '2.png',
    alt: 'Mood Tracker Screenshot',
    title: 'Mood Tracker',
    description: 'Mood Tracker lets you log how you feel throughout the day and spot emotional patterns over time. Colourful heatmaps and mood trends help you understand what lifts you up — and what drags you down. Understanding your mood patterns helps you catch emotional dips before they spiral. It gives you the power to recognize triggers, build healthier routines, and care for your mental well-being more intentionally',
  },
  {
    src: '3.png',
    alt: 'Life Balance EQ',
    title: 'Life Balance EQ',
    description: 'LifeEQ Tracker helps you keep your life in balance by visualizing how much time and energy you invest across different areas — like work, health, relationships, and fun. A radar chart gives you instant insight when one zone starts to dominate or drop.',
  },
  {
    src: '4.png',
    alt: 'Movie Tracker Screenshot',
    title: 'Movies Tracker',
    description: 'Movie Tracker lets you create and manage personalized watchlists, rate what you’ve seen, and get reminded of upcoming releases. Whether it’s a cozy rewatch or a cinema night plan — your film life, all in one place',
  },
  {
    src: '5.png',
    alt: 'Books Tracker Screenshot',
    title: 'Books Tracker',
    description: 'The Book Tracker helps you engage more deeply with what you read by adding personal conclusions, remarks, and exercises to each book. It’s your interactive reading journal — where thoughts don’t get lost and every book leaves a trace',
  },
  {
    src: '6.png',
    alt: 'Wish Tracker Screenshot',
    title: 'Wish Tracker',
    description: 'Wish Tracker helps you keep track of the things you truly want — from small everyday wishes to big life goals. Add notes, track your progress, and stay motivated as you move closer to making each wish a reality',
  },
];

const modules = [
  {
    title: 'Project Tracker',
    description: 'Organise projects & milestones in visual boards.',
    example: 'Kanban board for your app launch with swim-lanes: Backlog ➜ Coding ➜ Testing ➜ Shipped.',
    icon: <Activity size={32} />,
  },
  {
    title: 'Goals Tracker',
    description: 'Set and achieve measurable goals with streaks & reminders.',
    example: 'SMART goal – “Read 20 pages daily for 30 days” shows streak fire icon when on track.',
    icon: <Target size={32} />,
  },
  {
    title: 'Mood Tracker',
    description: 'Log mood & spot emotional patterns in colourful heatmaps.',
    example: 'Tap an emoji 3× a day; weekly heatmap reveals a mid-week energy dip.',
    icon: <BarChart2 size={32} />,
  },
  {
    title: 'LifeEQ Tracker',
    description: 'Keep overall life balance in check across 8 areas.',
    example: 'Radar chart instantly shows when “Social” drops below “Work” stress zone.',
    icon: <Brain size={32} />,
  },
  {
    title: "ToDo's Tracker",
    description: 'Tame your task list & beat chaos with prioritised queues.',
    example: 'Quick-add “Pay rent” – AI suggests due date & category automatically.',
    icon: <Plus size={32} />,
  },
  {
    title: 'Household Budget',
    description: 'Track income, expenses & balance at a glance.',
    example: 'Snap a grocery receipt; pie chart updates and warns when groceries > 30% of budget.',
    icon: <Calculator size={32} />,
  },
  {
    title: 'Wishlist Tracker',
    description: 'Plan purchases & stay motivated with saving progress.',
    example: 'Add “Nintendo Switch” – progress bar fills as you set money aside each week.',
    icon: <Gift size={32} />,
  },
  {
    title: 'Travel Planner',
    description: 'Plan trips stress-free with budgets, itineraries & packing lists.',
    example: '5-day Rome template auto-calculates daily food budget & reminds you to pack adapters.',
    icon: <Plane size={32} />,
  },
  {
    title: 'Shopping List',
    description: 'Never forget an item again – lists sync in real-time with family.',
    example: 'Partner adds “oat milk” from home; it pops onto your list in the store aisle.',
    icon: <ShoppingCart size={32} />,
  },
];

const stats = [
  { icon: <User size={40} className="text-blue-400" />, value: '100K+', label: 'Neurodiverse Users' },
  { icon: <Box size={40} className="text-blue-400" />,  value: '9',      label: 'Integrated Trackers' },
  { icon: <BarChart3 size={40} className="text-blue-400" />, value: '24/7', label: 'Cloud Sync' },
];

const testimonials = [
  { quote: 'MyTracker finally gave my ADHD brain structure without killing creativity!', author: 'Alice, Designer' },
  { quote: 'The daily focus timer keeps me on track every single hour.', author: 'Ben, Developer' },
  { quote: 'Mood analytics helped me notice burnout weeks before it hit.', author: 'Clara, Writer' },
];

const timeline = [
  { time: '07:00', title: 'Morning Snapshot',   desc: 'Quick mood log & review today’s goals.',          icon: <Clock size={20}/> },
  { time: '09:00', title: 'Deep-Work Block',    desc: 'Start Focus Timer in Project Tracker.',           icon: <BookOpenCheck size={20}/> },
  { time: '12:30', title: 'Lunch & Reflect',    desc: 'Update Mood, tick completed tasks.',             icon: <CheckCircle2 size={20}/> },
  { time: '15:00', title: 'Budget Check-in',    desc: 'Log any expenses, update balance.',              icon: <Calculator size={20}/> },
  { time: '18:00', title: 'Evening Wind-Down',  desc: 'Review progress & plan tomorrow.',              icon: <Target size={20}/> },
  { time: '22:30', title: 'Sleep & Sync',       desc: 'All data auto-syncs. Time to rest.',             icon: <BedDouble size={20}/> },
];

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.2 } } };
const fadeInUp           = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const LandingPage = () => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={containerVariants}
    className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-white scroll-smooth"
  >
    <motion.section variants={fadeInUp} className="text-center py-20 px-4">
      <h1 className="text-5xl font-bold mb-4">
        Built for <span className="text-blue-500">brains that bounce</span>
      </h1>
      <p className="text-xl max-w-2xl mx-auto text-gray-300 mb-8">
        One unified dashboard for focus, finances, feelings — designed with ADHD & Autistic brains in mind.
      </p>
      <Link
        to="/signup"
        className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full font-semibold hover:from-purple-700 hover:to-blue-600"
      >
        Try it Free
      </Link>
    </motion.section>

    <motion.section variants={fadeInUp} className="bg-gray-800/50 py-12 px-4">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-3xl font-bold mb-4">Why MyTracker?</h2>
          <ul className="list-disc list-inside space-y-3 text-gray-300">
            <li><strong>Zero context-switching.</strong> All life areas in one clean screen.</li>
            <li><strong>Brain-friendly UI.</strong> Big buttons, calm colors, no information overload.</li>
            <li><strong>Instant dopamine hits.</strong> Micro-rewards & colorful progress bars.</li>
            <li><strong>Data that helps.</strong> Mood heatmaps, budget trends, project burndown.</li>
            <li><strong>Built by neurodiverse devs.</strong> We use these tools every day ourselves.</li>
          </ul>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-6">
          <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Clock size={24} /> Daily Flow (24-hour guide)
          </h3>
          <ol className="space-y-3">
            {timeline.map((step) => (
              <li key={step.time} className="flex items-start gap-3">
                <span className="text-purple-400 w-14 shrink-0">{step.time}</span>
                <span className="text-purple-300 shrink-0">{step.icon}</span>
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

    <motion.section variants={fadeInUp} className="bg-gray-800/40 py-12 px-4">
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h2 className="text-3xl font-bold">Core Trackers</h2>
        <p className="text-gray-400">Nine modules, one brain-saving workspace.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {modules.map((mod, idx) => (
          <div key={idx} className="flip-card h-72">
            <div className="flip-card-inner">
              <div className="flip-card-front p-6 bg-gray-700/50 rounded-lg flex flex-col items-center justify-center text-center">
                {mod.icon}
                <h3 className="text-xl font-semibold mt-4">{mod.title}</h3>
              </div>
              <div className="flip-card-back p-6 bg-gray-800 rounded-lg flex flex-col items-start justify-center text-left space-y-2">
                <p className="text-gray-300 font-semibold leading-snug">{mod.description}</p>
                <p className="text-gray-400 text-xs italic">{mod.example}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>

    <motion.section variants={fadeInUp} className="py-16 px-4 bg-gray-700/50">
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Tracker Screenshots</h2>
        <p className="text-gray-400">A glimpse into the app — experience the magic for yourself.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {screenshots.map((shot, idx) => (
          <motion.div
            key={idx}
            variants={fadeInUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            whileHover={{ scale: 1.04 }}
            className="rounded-lg overflow-hidden shadow-lg bg-gray-800 transform transition-transform duration-300"
          >
            <img src={shot.src} alt={shot.alt} className="w-full h-64 object-cover" loading="lazy" />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{shot.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{shot.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>

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

    <motion.section variants={fadeInUp} className="text-center py-12 px-4">
      <h2 className="text-2xl font-bold mb-4">Start your focus journey today</h2>
      <Link
        to="/signup"
        className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full font-semibold hover:from-purple-700 hover:to-blue-600"
      >
        Create Your Free Account
      </Link>
    </motion.section>

    <motion.footer variants={fadeInUp} className="p-6 text-center bg-gray-900 text-gray-400">
      <p>© 2025 MyTracker — Designed by neurodiverse devs for neurodiverse minds.</p>
    </motion.footer>
  </motion.div>
);

export default LandingPage;