import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { adminAPI, testAPI, questionAPI } from '../services/api';
import {
  LayoutDashboard, Users, GraduationCap, UserCheck, Building2,
  BookOpen, ClipboardList, Trophy, FileText, BarChart3,
  Megaphone, Flag, LifeBuoy, TrendingUp, Activity, Settings,
  ChevronRight, ChevronDown, Menu, Search, Sun, Moon, LogOut, Layers,
  User2, X
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import BrandLogo from './BrandLogo';

const NAV = [
  {
    group: 'MANAGEMENT',
    items: [
      { id: 'dashboard',  label: 'Dashboard',         icon: LayoutDashboard, href: '/admin' },
      { id: 'users',      label: 'Users',              icon: Users,           section: 'users',
        sub: [
          { id: 'teachers',  label: 'Teachers',  icon: GraduationCap, section: 'users', filter: 'teachers' },
          { id: 'students',  label: 'Students',  icon: UserCheck,     section: 'users', filter: 'students' },
          { id: 'companies', label: 'Companies', icon: Building2,     section: 'users', filter: 'companies' },
        ]},
      { id: 'batches',    label: 'Batches / Sections', icon: Layers,          href: '/admin/batches' },
    ],
  },
  {
    group: 'ACADEMIC',
    items: [
      { id: 'problems',    label: 'Problems',    icon: BookOpen,      href: '/admin/problems' },
      { id: 'tests',       label: 'Tests',       icon: ClipboardList, href: '/admin/tests' },
      { id: 'submissions', label: 'Submissions', icon: FileText,      section: 'submissions' },
      { id: 'assessments', label: 'Assessments', icon: BarChart3,     section: 'assessments' },
    ],
  },
  {
    group: 'COMMUNICATION',
    items: [
      { id: 'announcements', label: 'Announcements',   icon: Megaphone, section: 'announcements' },
      { id: 'reports',       label: 'Reports',         icon: Flag,      section: 'reports' },
      { id: 'support',       label: 'Support Tickets', icon: LifeBuoy,  section: 'support' },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { id: 'analytics', label: 'Analytics',    icon: TrendingUp, section: 'analytics' },
      { id: 'health',    label: 'System Health',icon: Activity,   section: 'health'    },
      { id: 'settings',  label: 'Settings',     icon: Settings,   section: 'settings'  },
    ],
  },
];

/* ── Map from section → item id (for syncing active item) ──────── */
const SECTION_TO_ID = {
  overview:'dashboard', tests:'tests', users:'users', reports:'reports',
  submissions:'submissions', assessments:'assessments', announcements:'announcements',
  support:'support', analytics:'analytics', health:'health', settings:'settings',
};
const PATH_TO_ID = {
  '/admin': 'dashboard', '/admin/batches': 'batches', '/admin/problems': 'problems',
  '/admin/tests': 'tests',
  '/teacher': 'dashboard', '/teacher/students': 'students',
};

/* Teacher-accessible routes when sidebar targets admin-only paths */
const TEACHER_HREF_MAP = {
  '/admin': '/teacher',
  '/admin/problems': '/problems',
  '/admin/tests': '/contests',
  '/admin/batches': '/admin/batches',
};
const TEACHER_SECTION_ROUTES = {
  users: '/teacher/students',
  tests: '/contests',
  submissions: '/contests',
  assessments: '/contests',
  announcements: '/teacher',
  reports: '/teacher',
  support: '/teacher',
  analytics: '/teacher',
  health: '/teacher',
  settings: '/teacher',
};

export default function AdminLayout({ children, section = 'overview', onSectionChange, startCollapsed = false }) {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const location               = useLocation();
  const [sidebarOpen, setSidebarOpen]     = useState(!startCollapsed);
  const [expandedUsers, setExpandedUsers] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /* ── Global search ──────────────────────────────────────────────── */
  const [searchQ,      setSearchQ]      = useState('');
  const [searchRes,    setSearchRes]    = useState({ users: [], tests: [], problems: [] });
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchLoading,setSearchLoading]= useState(false);
  const searchRef   = useRef(null);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim().toLowerCase();
    if (trimmed.length < 2) { setSearchRes({ users: [], tests: [], problems: [] }); setSearchLoading(false); return; }
    setSearchLoading(true);
    try {
      const [uRes, tRes, qRes] = await Promise.allSettled([
        adminAPI.getUsers(),
        testAPI.getAll(),
        questionAPI.getAll(),
      ]);
      const users    = (uRes.status === 'fulfilled' ? uRes.value.data : [])
        .filter(u => (u.fullName||'').toLowerCase().includes(trimmed) || (u.email||'').toLowerCase().includes(trimmed))
        .slice(0, 5);
      const tests    = (tRes.status === 'fulfilled' ? tRes.value.data : [])
        .filter(t => (t.title||'').toLowerCase().includes(trimmed))
        .slice(0, 4);
      const problems = (qRes.status === 'fulfilled' ? qRes.value.data : [])
        .filter(p => (p.title||'').toLowerCase().includes(trimmed))
        .slice(0, 4);
      setSearchRes({ users, tests, problems });
    } catch {
      setSearchRes({ users: [], tests: [], problems: [] });
    }
    setSearchLoading(false);
  }, []);

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchQ(v);
    setSearchOpen(true);
    clearTimeout(debounceRef.current);
    if (v.trim().length < 2) { setSearchRes({ users: [], tests: [], problems: [] }); return; }
    debounceRef.current = setTimeout(() => runSearch(v), 350);
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isTeacher = user?.role === 'TEACHER';

  const goToUser  = () => {
    setSearchOpen(false);
    setSearchQ('');
    if (isTeacher) navigate('/teacher/students');
    else if (onSectionChange) onSectionChange('users');
  };
  const goToTest  = (t) => { setSearchOpen(false); setSearchQ(''); navigate(`/contest/${t.id}`); };
  const goToProb  = (p) => { setSearchOpen(false); setSearchQ(''); navigate(`/problem/${p.id}`); };

  const totalHits = searchRes.users.length + searchRes.tests.length + searchRes.problems.length;
  const hasQuery  = searchQ.trim().length >= 2;

  /* Track which sidebar item is active by its id.
     Derive directly from `section` prop — no useEffect needed.
     This avoids the "flash to dashboard" caused by the effect
     re-running after parent state update. */
  const activeId = PATH_TO_ID[location.pathname] || SECTION_TO_ID[section] || 'dashboard';

  const dark = theme === 'dark';

  const handleItem = (item) => {
    if (item.sub) {
      setExpandedUsers(v => !v);
      if (isTeacher) navigate('/teacher/students');
      else if (onSectionChange) onSectionChange(item.section || 'users');
      return;
    }
    if (isTeacher) {
      if (item.id === 'teachers' || item.id === 'companies') { navigate('/teacher'); return; }
      if (item.id === 'students' || item.filter === 'students') { navigate('/teacher/students'); return; }
      if (item.href) { navigate(TEACHER_HREF_MAP[item.href] || item.href); return; }
      const dest = TEACHER_SECTION_ROUTES[item.section] || '/teacher';
      navigate(dest);
      return;
    }
    if (item.href) { navigate(item.href); return; }
    if (item.filter) {
      if (onSectionChange) onSectionChange(item.section, { filter: item.filter });
    } else if (onSectionChange) {
      onSectionChange(item.section);
    }
  };

  /* tokens */
  const bg  = dark ? 'bg-gray-900 border-gray-700/60'   : 'bg-white border-gray-200';
  const tx  = dark ? 'text-gray-300'                    : 'text-gray-600';
  const txH = dark ? 'hover:bg-gray-800 hover:text-gray-100' : 'hover:bg-gray-100 hover:text-gray-900';
  const lbl = dark ? 'text-gray-500'                    : 'text-gray-400';
  const hdr = dark ? 'bg-gray-900 border-gray-700/60'   : 'bg-white border-gray-200';
  const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';
  const pg  = dark ? 'bg-gray-950' : 'bg-slate-50';
  const divBdr = dark ? 'border-gray-700/60' : 'border-gray-200';

  return (
    <div className={`flex h-screen overflow-hidden ${pg}`}>

      {/* ══ Sidebar ═════════════════════════════════════════════════ */}
      <aside className={`${sidebarOpen ? 'w-[210px]' : 'w-0 overflow-hidden'} flex-shrink-0 border-r flex flex-col transition-all duration-200 ${bg}`}>
        {/* Logo */}
        <div className={`flex items-center px-4 py-4 border-b ${divBdr}`}>
          <BrandLogo to="/admin" className="text-white" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-2">
          {NAV.map(group => (
            <div key={group.group}>
              <p className={`text-[10px] font-bold uppercase tracking-widest px-3 mb-1 ${lbl}`}>{group.group}</p>
              {group.items.map(item => {
                const Icon   = item.icon;
                const active = activeId === item.id;
                return (
                  <div key={item.id}>
                    <button onClick={() => handleItem(item)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-all mb-0.5
                        ${active
                          ? 'bg-orange-500/10 text-orange-500 font-semibold'
                          : `${tx} ${txH}`}`}>
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-orange-500' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.sub && (expandedUsers
                        ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />)}
                    </button>

                    {/* Sub-items */}
                    {item.sub && expandedUsers && (
                      <div className={`ml-5 pl-2 border-l space-y-0.5 mb-1 ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                        {item.sub.map(s => {
                          const SI = s.icon;
                          const subActive = activeId === s.id;
                          return (
                            <button key={s.id} onClick={() => handleItem(s)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all
                                ${subActive
                                  ? 'bg-orange-500/10 text-orange-500 font-semibold'
                                  : `${tx} ${txH}`}`}>
                              <SI className={`w-3.5 h-3.5 ${subActive ? 'text-orange-500' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ══ Main ════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className={`border-b flex items-center gap-3 px-5 py-3 flex-shrink-0 ${hdr}`}>
          <button onClick={() => setSidebarOpen(v => !v)}
            className={`p-1.5 rounded-xl transition-all ${dark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block min-w-0">
            <h1 className={`text-base font-bold leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
            <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Overview of platform activity and performance.</p>
          </div>
          <div ref={searchRef} className="flex-1 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={searchQ}
              onChange={handleSearchChange}
              onFocus={() => searchQ.trim().length >= 2 && setSearchOpen(true)}
              placeholder="Search students, teachers, tests, problems..."
              className={`w-full border rounded-xl pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 transition-all ${inp}`}
            />
            {searchQ
              ? <button onClick={() => { setSearchQ(''); setSearchOpen(false); setSearchRes({ users:[], tests:[], problems:[] }); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              : <kbd className={`hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 text-[10px] rounded px-1.5 py-0.5 items-center ${dark?'bg-gray-700 text-gray-400':'bg-gray-200 text-gray-500'}`}>⌘K</kbd>
            }

            {/* ── Search dropdown ── */}
            {searchOpen && hasQuery && (
              <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-2xl border shadow-xl z-50 overflow-hidden ${dark?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
                {searchLoading ? (
                  <div className={`px-4 py-6 text-center text-sm ${dark?'text-gray-400':'text-gray-500'}`}>Searching…</div>
                ) : totalHits === 0 ? (
                  <div className={`px-4 py-6 text-center text-sm ${dark?'text-gray-400':'text-gray-500'}`}>No results for <b>"{searchQ}"</b></div>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-2">
                    {searchRes.users.length > 0 && (
                      <div>
                        <p className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest ${dark?'text-gray-500':'text-gray-400'}`}>Users</p>
                        {searchRes.users.map(u => (
                          <button key={u.id} onClick={() => goToUser(u)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${dark?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                            <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                              <User2 className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${dark?'text-gray-200':'text-gray-800'}`}>{u.fullName}</p>
                              <p className={`text-xs truncate ${dark?'text-gray-500':'text-gray-400'}`}>{u.email} · {u.role}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchRes.tests.length > 0 && (
                      <div>
                        <p className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest ${dark?'text-gray-500':'text-gray-400'}`}>Tests</p>
                        {searchRes.tests.map(t => (
                          <button key={t.id} onClick={() => goToTest(t)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${dark?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                            <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                              <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${dark?'text-gray-200':'text-gray-800'}`}>{t.title}</p>
                              <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{t.published?'Published':'Draft'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchRes.problems.length > 0 && (
                      <div>
                        <p className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest ${dark?'text-gray-500':'text-gray-400'}`}>Problems</p>
                        {searchRes.problems.map(p => (
                          <button key={p.id} onClick={() => goToProb(p)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${dark?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${dark?'text-gray-200':'text-gray-800'}`}>{p.title}</p>
                              <p className={`text-xs capitalize ${dark?'text-gray-500':'text-gray-400'}`}>{(p.difficulty||'').toLowerCase()}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'}
              className={`p-2 rounded-xl transition-all ${dark ? 'text-gray-400 hover:bg-gray-800 hover:text-yellow-400' : 'text-gray-500 hover:bg-gray-100 hover:text-amber-500'}`}>
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <div className={`flex items-center gap-2 pl-2 border-l ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {user?.fullName?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden md:block">
                <p className={`text-xs font-semibold leading-tight ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{user?.fullName || 'Admin User'}</p>
                <p className={`text-[10px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>System Admin</p>
              </div>
            </div>
            <button onClick={() => setShowLogoutModal(true)} title="Logout"
              className={`p-2 rounded-xl transition-all ${dark ? 'text-gray-500 hover:bg-red-500/10 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className={`relative rounded-2xl shadow-2xl p-6 w-full max-w-sm border ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <LogOut className="w-7 h-7 text-red-400" />
              </div>
              <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Log out?</h3>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                Are you sure you want to log out of the admin panel?
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setShowLogoutModal(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${dark ? 'border-slate-600 text-slate-300 hover:text-white hover:border-slate-500' : 'border-gray-300 text-gray-600 hover:text-gray-900'}`}>
                  Cancel
                </button>
                <button onClick={() => { setShowLogoutModal(false); logout(); navigate('/login'); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
