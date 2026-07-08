import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { questionAPI, testAPI } from '../services/api';
import api from '../services/api';
import { BookOpen, Clock, ArrowRight, Target, Flame, CheckCircle2, Play, Calendar, ChevronRight, Pencil, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Daily Goal helpers ── */
const GOAL_KEY = 'cg_daily_goal';
function getDailyGoal() {
  return parseInt(localStorage.getItem(GOAL_KEY) || '5', 10);
}
function getTodaySolvedCount(profile) {
  // Use heatmap for today's count if available, otherwise fall back to 0
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  return profile?.heatmap?.[key] || 0;
}

/* ── Circular progress SVG ── */
function CircleProgress({ solved, goal, light }) {
  const pct = goal > 0 ? Math.min(solved / goal, 1) : 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none"
          stroke={light ? '#ede9fe' : '#3b1fa8'}
          strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none"
          stroke="#7c3aed"
          strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{solved} / {goal}</span>
        <span className={`text-[11px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>Problems solved</span>
      </div>
    </div>
  );
}

/* ── Format test date/time ── */
function fmtDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' • ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
}

/* ── Test icon gradient by index ── */
const iconGrads = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-orange-500 to-red-600',
  'from-teal-500 to-cyan-600',
  'from-green-500 to-emerald-600',
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'light';

  const [questions, setQuestions] = useState([]);
  const [activeTests, setActiveTests] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Daily goal state */
  const [goal, setGoal] = useState(getDailyGoal());
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(getDailyGoal()));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [questionsRes, activeRes, upcomingRes, profileRes] = await Promise.all([
        questionAPI.getAll(),
        testAPI.getActive(),
        testAPI.getUpcoming().catch(() => ({ data: [] })),
        api.get('/profile/me'),
      ]);
      setQuestions(questionsRes.data);
      setActiveTests(activeRes.data);
      setUpcomingTests(upcomingRes.data || []);
      setProfile(profileRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const saveGoal = () => {
    const n = parseInt(goalInput, 10);
    if (!n || n < 1 || n > 50) { toast.error('Goal must be 1–50'); return; }
    setGoal(n);
    localStorage.setItem(GOAL_KEY, String(n));
    setEditingGoal(false);
    toast.success('Daily goal updated!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalSolved = profile?.totalSolved || 0;
  const totalQ = profile?.totalQuestions || questions.length;
  const todaySolved = getTodaySolvedCount(profile);
  const remaining = Math.max(goal - todaySolved, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>
          Hello, <span className="gradient-text">{user?.fullName?.split(' ')[0]}</span> 👋
        </h1>
        <p className={`text-sm mt-1 ${light ? 'text-gray-500' : 'text-slate-400'}`}>Let's solve some problems today</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Target className="w-5 h-5 text-violet-400" />, bg: 'bg-violet-500/15', val: `${totalSolved}`, sub: `/${totalQ} Solved`, valCls: light ? 'text-gray-900' : 'text-white' },
          { icon: <CheckCircle2 className="w-5 h-5 text-[#00b8a3]" />, bg: 'bg-emerald-500/15', val: String(profile?.easySolved || 0), sub: 'Easy', valCls: 'text-[#00b8a3]' },
          { icon: <Flame className="w-5 h-5 text-[#ffc01e]" />, bg: 'bg-amber-500/15', val: String(profile?.mediumSolved || 0), sub: 'Medium', valCls: 'text-[#ffc01e]' },
          { icon: <Flame className="w-5 h-5 text-[#ef4743]" />, bg: 'bg-red-500/15', val: String(profile?.hardSolved || 0), sub: 'Hard', valCls: 'text-[#ef4743]' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>{s.icon}</div>
            <div>
              <p className={`text-lg font-bold ${s.valCls}`}>{s.val}<span className={`text-sm font-normal ${light ? 'text-gray-400' : 'text-slate-500'}`}>{s.sub}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Tests Alert */}
      {activeTests.length > 0 && (
        <div className="mb-6 space-y-2">
          {activeTests.map(test => (
            <div key={test.id} className={`glass-card p-4 flex items-center justify-between border ${light ? 'border-emerald-200' : 'border-emerald-500/30'}`}>
              <div className="flex items-center gap-3">
                <div className="pulse-dot"></div>
                <div>
                  <p className={`font-medium text-sm ${light ? 'text-gray-800' : 'text-white'}`}>{test.title}</p>
                  <p className={`text-xs ${light ? 'text-gray-400' : 'text-slate-500'}`}>{test.totalQuestions} questions • {test.durationMinutes} min</p>
                </div>
              </div>
              <Link to={`/test/${test.id}`} className="btn-success text-xs py-1.5 px-4 flex items-center gap-1">
                <Play className="w-3 h-3" /> Start
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Upcoming Tests */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className={`flex items-center justify-between px-5 py-3 border-b ${light ? 'border-gray-100' : 'border-slate-700/50'}`}>
            <h3 className={`text-sm font-semibold ${light ? 'text-gray-800' : 'text-white'}`}>Upcoming Tests</h3>
            <Link to="/contests" className="flex items-center gap-1 text-[12px] text-[#ffa116] hover:opacity-80">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingTests.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Calendar className={`w-8 h-8 mx-auto mb-2 ${light ? 'text-gray-300' : 'text-slate-700'}`} />
              <p className={`text-sm ${light ? 'text-gray-400' : 'text-slate-500'}`}>No upcoming tests</p>
            </div>
          ) : (
            <div className={`divide-y ${light ? 'divide-gray-100' : 'divide-slate-800/50'}`}>
              {upcomingTests.slice(0, 5).map((test, i) => (
                <Link key={test.id} to={`/contest/${test.id}`}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${light ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]'}`}>
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGrads[i % iconGrads.length]} flex items-center justify-center flex-shrink-0`}>
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${light ? 'text-gray-800' : 'text-white'}`}>{test.title}</p>
                    <p className={`text-[11px] mt-0.5 ${light ? 'text-gray-400' : 'text-slate-500'}`}>{fmtDateTime(test.startTime)}</p>
                    <div className="flex gap-2 mt-1.5">
                      {test.durationMinutes && (
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${light ? 'bg-violet-50 text-violet-600' : 'bg-violet-500/10 text-violet-400'}`}>
                          <Clock className="w-3 h-3" /> {test.durationMinutes} min
                        </span>
                      )}
                      {test.totalMarks && (
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${light ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                          <Trophy className="w-3 h-3" /> {test.totalMarks} marks
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${light ? 'text-gray-300' : 'text-slate-600'}`} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Daily Goal */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${light ? 'text-gray-800' : 'text-white'}`}>Daily Goal</h3>
            {!editingGoal ? (
              <button onClick={() => { setGoalInput(String(goal)); setEditingGoal(true); }}
                className={`flex items-center gap-1 text-[12px] text-[#ffa116] hover:opacity-80`}>
                <Pencil className="w-3 h-3" /> Edit Goal
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min="1" max="50"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  className={`w-14 text-center text-xs py-1 px-2 rounded-lg border outline-none focus:ring-2 focus:ring-violet-500 ${light ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-[#282828] border-[#3e3e3e] text-white'}`}
                  onKeyDown={e => e.key === 'Enter' && saveGoal()}
                  autoFocus
                />
                <button onClick={saveGoal} className="text-[11px] bg-violet-600 text-white px-2 py-1 rounded-lg hover:bg-violet-700">Save</button>
                <button onClick={() => setEditingGoal(false)} className={`text-[11px] px-2 py-1 rounded-lg ${light ? 'text-gray-500 hover:bg-gray-100' : 'text-slate-400 hover:bg-[#282828]'}`}>✕</button>
              </div>
            )}
          </div>

          {/* Circle */}
          <div className="flex items-center gap-5 flex-1">
            <CircleProgress solved={todaySolved} goal={goal} light={light} />
            <div className="flex-1">
              {todaySolved >= goal ? (
                <p className={`text-sm font-semibold mb-3 ${light ? 'text-gray-700' : 'text-slate-200'}`}>
                  🎉 Goal complete!
                </p>
              ) : (
                <p className={`text-sm font-medium mb-1 leading-snug ${light ? 'text-gray-700' : 'text-slate-200'}`}>
                  {todaySolved === 0 ? "Start solving today!" : "Great! You're almost there."}
                </p>
              )}
              <Link to="/problems"
                className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                  light
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-[#282828] text-slate-200 hover:bg-[#333]'
                }`}>
                Solve Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {remaining > 0 && (
            <p className={`text-[11px] mt-4 text-center ${light ? 'text-gray-400' : 'text-slate-500'}`}>
              {remaining} more problem{remaining !== 1 ? 's' : ''} to complete your daily goal.
            </p>
          )}
          {remaining === 0 && (
            <p className={`text-[11px] mt-4 text-center text-[#00b8a3]`}>
              You've hit your goal for today! 🔥
            </p>
          )}
        </div>
      </div>

      {/* Problems Table */}
      <div className="glass-card overflow-hidden mb-6">
        <div className={`flex items-center justify-between px-5 py-3 border-b ${light ? 'border-gray-100' : 'border-slate-700/50'}`}>
          <h3 className={`text-sm font-semibold ${light ? 'text-gray-800' : 'text-white'}`}>Problems</h3>
          <Link to="/problems" className="text-xs text-[#ffa116] hover:opacity-80 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className={`divide-y ${light ? 'divide-gray-100' : 'divide-slate-800/50'}`}>
          {questions.slice(0, 15).map((q, i) => (
            <Link key={q.id} to={`/problem/${q.id}`}
              className={`flex items-center justify-between px-5 py-3 transition-colors group ${light ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs w-6 text-right font-mono ${light ? 'text-gray-300' : 'text-slate-600'}`}>{i + 1}</span>
                <span className={`text-sm transition-colors ${light ? 'text-gray-700 group-hover:text-gray-900' : 'text-slate-200 group-hover:text-white'}`}>{q.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex gap-1">
                  {q.tags?.slice(0, 2).map((tag, j) => (
                    <span key={j} className={`text-[10px] px-1.5 py-0.5 rounded ${light ? 'bg-gray-100 text-gray-500' : 'bg-[#282828] text-slate-500'}`}>{tag}</span>
                  ))}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  q.difficulty === 'EASY' ? 'text-[#00b8a3] bg-[rgba(0,184,163,0.1)]' :
                  q.difficulty === 'MEDIUM' ? 'text-[#ffc01e] bg-[rgba(255,192,30,0.1)]' :
                  'text-[#ef4743] bg-[rgba(239,71,67,0.1)]'
                }`}>
                  {q.difficulty === 'EASY' ? 'Easy' : q.difficulty === 'MEDIUM' ? 'Med.' : 'Hard'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Achievements / Badges */}
      {(() => {
        const BADGES = [
          { id:'first',     icon:'🚀', label:'First Steps',    desc:'Solved your first problem',  earned: totalSolved >= 1 },
          { id:'five',      icon:'⭐', label:'Rookie',         desc:'5 problems solved',           earned: totalSolved >= 5 },
          { id:'ten',       icon:'💡', label:'Problem Solver', desc:'10 problems solved',          earned: totalSolved >= 10 },
          { id:'twentyfive',icon:'🔥', label:'On Fire',        desc:'25 problems solved',          earned: totalSolved >= 25 },
          { id:'fifty',     icon:'🏅', label:'Champion',       desc:'50 problems solved',          earned: totalSolved >= 50 },
          { id:'hundred',   icon:'👑', label:'Legend',         desc:'100 problems solved',         earned: totalSolved >= 100 },
          { id:'easy10',    icon:'🟢', label:'Easy Ace',       desc:'10 easy problems',            earned: (profile?.easySolved||0) >= 10 },
          { id:'medium5',   icon:'🟡', label:'Medium Grind',   desc:'5 medium problems',           earned: (profile?.mediumSolved||0) >= 5 },
          { id:'hard1',     icon:'🔴', label:'Hard Worker',    desc:'Solved a hard problem',       earned: (profile?.hardSolved||0) >= 1 },
        ];
        const earnedCount = BADGES.filter(b=>b.earned).length;
        return (
          <div className="glass-card overflow-hidden mt-5">
            <div className={`flex items-center justify-between px-5 py-3 border-b ${light?'border-gray-100':'border-slate-700/50'}`}>
              <h3 className={`text-sm font-semibold ${light?'text-gray-800':'text-white'}`}>Achievements</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${light?'bg-amber-50 text-amber-600':'bg-amber-500/10 text-amber-400'}`}>
                {earnedCount}/{BADGES.length} earned
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-0">
              {BADGES.map(b => (
                <div key={b.id} title={b.desc}
                  className={`flex flex-col items-center gap-1.5 px-3 py-4 transition-all ${b.earned?'opacity-100':'opacity-30 grayscale'}`}>
                  <span className="text-2xl">{b.icon}</span>
                  <p className={`text-[10px] font-semibold text-center leading-tight ${light?'text-gray-700':'text-slate-300'}`}>{b.label}</p>
                  {b.earned && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${light?'bg-emerald-100 text-emerald-600':'bg-emerald-500/15 text-emerald-400'}`}>Unlocked</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
