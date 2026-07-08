import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import api from '../services/api';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Filter, BarChart2, Target } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── helpers ── */
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const now = new Date();
  const diff = now - dt;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} minute${m !== 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h !== 1 ? 's' : ''} ago`;
  const dy = Math.floor(h / 24);
  if (dy < 30) return dy === 0 ? 'Today' : `${dy}d ago`;
  // Show "Jul 3" style
  return dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const diffColor = (d, light) => {
  if (!d) return '';
  const map = {
    EASY: light ? 'text-[#059669]' : 'text-[#00b8a3]',
    MEDIUM: light ? 'text-[#d97706]' : 'text-[#ffc01e]',
    HARD: light ? 'text-[#dc2626]' : 'text-[#ef4743]',
  };
  return map[d] || '';
};
const diffLabel = (d) => ({ EASY: 'Easy', MEDIUM: 'Med.', HARD: 'Hard' }[d] || d);

/* ── Topic Bubble Chart (pure SVG pack layout) ── */
function TopicBubbles({ topics, light }) {
  const [hovered, setHovered] = useState(null);
  const W = 340, H = 320;
  const SEED = 42;

  if (!topics || topics.length === 0) return (
    <div className={`flex items-center justify-center h-40 text-sm ${light ? 'text-gray-400' : 'text-slate-500'}`}>No topic data</div>
  );

  // Size circles by solved count (min 22, max 56)
  const maxSolved = Math.max(...topics.map(t => t.solved), 1);
  const r = (t) => Math.max(22, Math.min(56, 22 + (t.solved / maxSolved) * 34));

  // Simple deterministic packing: spiral placement
  const placed = [];
  const rng = (seed) => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; };
  const rand = rng(SEED);

  const overlaps = (x, y, radius, others) =>
    others.some(o => Math.hypot(x - o.x, y - o.y) < radius + o.r + 3);

  const CX = W / 2, CY = H / 2;
  const sorted = [...topics].sort((a, b) => b.solved - a.solved);

  sorted.forEach((t, i) => {
    const ri = r(t);
    if (i === 0) { placed.push({ ...t, x: CX, y: CY, r: ri }); return; }
    let best = null;
    for (let attempt = 0; attempt < 400; attempt++) {
      const angle = rand() * Math.PI * 2;
      const dist = ri + 5 + rand() * (Math.min(W, H) * 0.45);
      const cx = CX + Math.cos(angle) * dist * (0.5 + rand() * 0.5);
      const cy = CY + Math.sin(angle) * dist * (0.5 + rand() * 0.5);
      if (cx - ri < 2 || cx + ri > W - 2 || cy - ri < 2 || cy + ri > H - 2) continue;
      if (!overlaps(cx, cy, ri, placed)) { best = { cx, cy }; break; }
    }
    if (best) placed.push({ ...t, x: best.cx, y: best.cy, r: ri });
  });

  const strokeColor = light ? '#d1d5db' : '#3e3e3e';
  const fillColor = light ? '#f3f4f6' : '#282828';
  const textColor = light ? '#374151' : '#a0a0a0';

  return (
    <div className="relative">
      <svg width={W} height={H} className="overflow-visible">
        {placed.map((t, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}>
            <circle
              cx={t.x} cy={t.y} r={t.r}
              fill={t.solved > 0 ? (light ? 'rgba(0,184,163,0.12)' : 'rgba(0,184,163,0.10)') : fillColor}
              stroke={t.solved > 0 ? (light ? '#059669' : '#00b8a3') : strokeColor}
              strokeWidth={t.solved > 0 ? 1.5 : 1}
            />
            {t.r >= 28 && (
              <text x={t.x} y={t.y - (t.r >= 32 ? 4 : 1)} textAnchor="middle"
                fontSize={Math.max(8, Math.min(11, t.r * 0.3))}
                fill={t.solved > 0 ? (light ? '#059669' : '#00b8a3') : textColor}
                fontWeight="500" style={{ pointerEvents: 'none' }}>
                {t.tag.length > 12 ? t.tag.slice(0, 10) + '…' : t.tag}
              </text>
            )}
            {t.r >= 32 && t.solved > 0 && (
              <text x={t.x} y={t.y + 10} textAnchor="middle"
                fontSize="9" fill={light ? '#059669' : '#00b8a3'}
                style={{ pointerEvents: 'none' }}>
                {t.solved}/{t.total}
              </text>
            )}
          </g>
        ))}
      </svg>
      {/* Tooltip */}
      {hovered !== null && placed[hovered] && (
        <div className={`absolute z-10 px-3 py-1.5 rounded-lg text-xs shadow-lg pointer-events-none border ${
          light ? 'bg-white border-gray-200 text-gray-800' : 'bg-[#282828] border-[#3e3e3e] text-white'
        }`}
          style={{ left: placed[hovered].x + placed[hovered].r + 6, top: placed[hovered].y - 14 }}>
          <span className="font-semibold">{placed[hovered].tag}</span>
          <span className={` ml-1.5 ${light ? 'text-gray-400' : 'text-slate-400'}`}>
            {placed[hovered].solved}/{placed[hovered].total}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Mini bar chart for daily activity ── */
function ActivityChart({ heatmap, light }) {
  const [view, setView] = useState('solved'); // 'solved' | 'submissions'

  // Build last 30 days
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({ key, label: d.getDate() === 1 ? d.toLocaleString('en', { month: 'short' }) : String(d.getDate()), count: heatmap?.[key] || 0 });
  }
  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {['solved', 'submissions'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors capitalize ${
              view === v
                ? 'bg-[#00b8a3] text-white'
                : light ? 'text-gray-500 hover:bg-gray-100' : 'text-slate-500 hover:bg-white/5'
            }`}>{v === 'solved' ? 'Solved' : 'Submissions'}</button>
        ))}
      </div>
      <div className="flex items-end gap-[3px] h-16">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1 group relative">
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: `${Math.max(2, (d.count / maxCount) * 56)}px`,
                background: d.count > 0 ? '#00b8a3' : (light ? '#e5e7eb' : '#282828'),
                opacity: d.count > 0 ? 1 : 0.5,
              }}
            />
            {/* Tooltip on hover */}
            <div className={`absolute bottom-full mb-1 px-2 py-0.5 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 ${
              light ? 'bg-gray-800 text-white' : 'bg-[#3e3e3e] text-white'
            }`}>
              {d.key}: {d.count}
            </div>
          </div>
        ))}
      </div>
      <div className={`flex justify-between text-[9px] mt-1 ${light ? 'text-gray-400' : 'text-slate-600'}`}>
        <span>{days[0]?.key?.slice(5)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

/* ── Main Progress Page ── */
export default function Progress() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const light = theme === 'light';

  const [history, setHistory] = useState([]);
  const [topics, setTopics] = useState([]);
  const [profile, setProfile] = useState(null);
  const [historyStats, setHistoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | accepted | wrong
  const [expanded, setExpanded] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [histRes, profRes] = await Promise.all([
        profileAPI.getHistory().catch(() => null),
        api.get('/profile/me').catch(() => null),
      ]);
      if (histRes?.data) {
        setHistory(histRes.data.history || []);
        setTopics(histRes.data.topics || []);
        setHistoryStats({
          totalSubmissions: histRes.data.totalSubmissions,
          acceptanceRate: histRes.data.acceptanceRate,
        });
      }
      if (profRes?.data) setProfile(profRes.data);
    } catch (e) {
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#00b8a3] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Filter history
  const filtered = history.filter(h => {
    if (filter === 'accepted') return h.lastResult === 'ACCEPTED';
    if (filter === 'wrong') return h.lastResult !== 'ACCEPTED';
    return true;
  });
  const displayed = showAll ? filtered : filtered.slice(0, 15);

  const resultLabel = (r) => {
    if (r === 'ACCEPTED') return 'Accepted';
    if (r === 'WRONG_ANSWER') return 'Wrong Answer';
    if (r === 'TIME_LIMIT_EXCEEDED') return 'TLE';
    if (r === 'COMPILE_ERROR') return 'Compile Error';
    if (r === 'RUNTIME_ERROR') return 'Runtime Error';
    return r || '—';
  };

  const bg = light ? 'bg-white border-gray-200' : 'bg-[#282828] border-[#3e3e3e]';
  const hdr = light ? 'text-gray-700' : 'text-slate-300';
  const sub = light ? 'text-gray-400' : 'text-slate-500';
  const row = light ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]';
  const divider = light ? 'divide-gray-100' : 'divide-slate-800/50';
  const border = light ? 'border-gray-100' : 'border-slate-800/50';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className={`text-xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>Progress</h1>
        <p className={`text-sm mt-0.5 ${sub}`}>Track your solving history and topic coverage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── LEFT: Practice History ── */}
        <div className={`lg:col-span-3 rounded-2xl border ${bg}`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-3 border-b ${border}`}>
            <h2 className={`text-sm font-semibold ${light ? 'text-gray-800' : 'text-white'}`}>Practice History</h2>
            <div className={`flex items-center gap-1 text-[11px] ${sub}`}>
              <Filter className="w-3 h-3" />
              {['all','accepted','wrong'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    filter === f
                      ? 'bg-[#00b8a3] text-white'
                      : light ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/5 text-slate-500'
                  }`}>{f === 'wrong' ? 'Wrong' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div className={`grid grid-cols-[120px_1fr_110px_80px] px-5 py-2 text-[11px] font-medium border-b ${border} ${sub}`}>
            <span>Last Submitted</span>
            <span>Problem</span>
            <span>Last Result</span>
            <span className="text-right">Submissions</span>
          </div>

          {/* Rows */}
          <div className={`divide-y ${divider}`}>
            {displayed.length === 0 ? (
              <div className="py-12 text-center">
                <Target className={`w-8 h-8 mx-auto mb-2 ${light ? 'text-gray-300' : 'text-slate-700'}`} />
                <p className={`text-sm ${sub}`}>No submissions yet</p>
                <Link to="/problems" className="text-[#ffa116] text-xs hover:opacity-80 mt-1 inline-block">Start solving →</Link>
              </div>
            ) : displayed.map((h, i) => (
              <div key={i}>
                <div className={`grid grid-cols-[120px_1fr_110px_80px] px-5 py-2.5 transition-colors cursor-pointer ${row}`}
                  onClick={() => setExpanded(expanded === i ? null : i)}>
                  <span className={`text-[12px] ${sub} leading-5`}>{fmtDate(h.lastSubmittedAt)}</span>
                  <div className="min-w-0 pr-2">
                    <Link to={`/problem/${h.questionId}`}
                      onClick={e => e.stopPropagation()}
                      className={`text-[13px] font-medium hover:text-[#ffa116] transition-colors truncate block ${light ? 'text-gray-800' : 'text-slate-200'}`}>
                      {h.questionTitle}
                    </Link>
                    <span className={`text-[11px] font-medium ${diffColor(h.difficulty, light)}`}>{diffLabel(h.difficulty)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {h.lastResult === 'ACCEPTED'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00b8a3] flex-shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 text-[#ef4743] flex-shrink-0" />}
                    <span className={`text-[12px] ${h.lastResult === 'ACCEPTED' ? 'text-[#00b8a3]' : 'text-[#ef4743]'}`}>
                      {resultLabel(h.lastResult)}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <span className={`text-[12px] ${sub}`}>{h.count}</span>
                    {expanded === i ? <ChevronUp className={`w-3 h-3 ${sub}`} /> : <ChevronDown className={`w-3 h-3 ${sub}`} />}
                  </div>
                </div>
                {/* Expanded detail */}
                {expanded === i && (
                  <div className={`px-5 pb-3 pt-1 ${light ? 'bg-gray-50' : 'bg-white/[0.02]'}`}>
                    <div className="flex flex-wrap gap-2">
                      {h.tags?.map((tag, ti) => (
                        <span key={ti} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          light ? 'bg-gray-200 text-gray-600' : 'bg-[#3e3e3e] text-slate-400'
                        }`}>{tag}</span>
                      ))}
                      {h.language && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          light ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'
                        }`}>{String(h.language)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Show more */}
          {filtered.length > 15 && (
            <div className={`px-5 py-3 border-t ${border}`}>
              <button onClick={() => setShowAll(!showAll)}
                className={`text-xs font-medium text-[#ffa116] hover:opacity-80`}>
                {showAll ? `Show less` : `Show all ${filtered.length} entries`}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Summary ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Stats card */}
          <div className={`rounded-2xl border ${bg} p-5`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${sub}`}>Summary</h3>

            {/* Total solved */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{profile?.totalSolved || 0}</span>
                <span className={`text-sm font-medium ${light ? 'text-indigo-500' : 'text-indigo-400'}`}>Problems</span>
              </div>
              <div className={`flex gap-4 text-[12px] ${sub}`}>
                <span>Easy <strong className="text-[#00b8a3] ml-1">{profile?.easySolved || 0}</strong></span>
                <span>Med. <strong className="text-[#ffc01e] ml-1">{profile?.mediumSolved || 0}</strong></span>
                <span>Hard <strong className="text-[#ef4743] ml-1">{profile?.hardSolved || 0}</strong></span>
              </div>
            </div>

            {/* Divider */}
            <div className={`border-t ${border} my-3`} />

            {/* Submissions + Acceptance */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-3 ${light ? 'bg-gray-50' : 'bg-[#1e1e1e]'}`}>
                <p className={`text-[11px] ${sub} mb-0.5`}>Submissions</p>
                <p className={`text-lg font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{historyStats?.totalSubmissions || profile?.totalSubmissions || 0}</p>
              </div>
              <div className={`rounded-xl p-3 ${light ? 'bg-gray-50' : 'bg-[#1e1e1e]'}`}>
                <p className={`text-[11px] ${sub} mb-0.5`}>Acceptance</p>
                <p className={`text-lg font-bold text-[#00b8a3]`}>{historyStats?.acceptanceRate || 0}%</p>
              </div>
            </div>
          </div>

          {/* Topic Bubble Chart */}
          <div className={`rounded-2xl border ${bg} p-4`}>
            <div className={`flex items-center justify-between mb-3`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${sub}`}>Topics</h3>
              <span className={`text-[10px] ${sub}`}>{topics.filter(t => t.solved > 0).length} topics solved</span>
            </div>
            <TopicBubbles topics={topics} light={light} />
            <div className={`flex items-center gap-3 mt-2 text-[10px] ${sub}`}>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full border border-[#00b8a3] bg-[rgba(0,184,163,0.1)]" />
                Solved
              </span>
              <span className="flex items-center gap-1">
                <span className={`inline-block w-3 h-3 rounded-full border ${light ? 'border-gray-300 bg-gray-100' : 'border-[#3e3e3e] bg-[#282828]'}`} />
                Not started
              </span>
            </div>
          </div>

          {/* Activity Chart */}
          <div className={`rounded-2xl border ${bg} p-4`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${sub}`}>Last 30 Days Activity</h3>
            <ActivityChart heatmap={profile?.heatmap} light={light} />
          </div>
        </div>

      </div>
    </div>
  );
}
