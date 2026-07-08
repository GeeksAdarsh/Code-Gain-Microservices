import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, BookOpen, Code2, GraduationCap, Trophy, Settings, Building2, Sun, Moon, Users, AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import BrandLogo from './BrandLogo';



export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const light = theme === 'light';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'TEACHER': return '/teacher';
      case 'COMPANY': return '/company';
      case 'STUDENT': return '/student';
      default: return '/';
    }
  };

  const link  = light ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-[#a0a0a0] hover:text-white hover:bg-white/5';
  const icon  = light ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-100' : 'text-[#a0a0a0] hover:text-white hover:bg-white/5';
  const user_ = light ? 'bg-gray-100 border-gray-200 hover:border-orange-400/40' : 'bg-[#282828] border-[#3e3e3e] hover:border-[#ffa116]/40';
  const uName = light ? 'text-gray-700' : 'text-[#a0a0a0]';
  const navBg = light ? 'bg-white border-gray-200' : 'bg-[#1a1a1a] border-[#3e3e3e]';

  return (
    <>
    <nav className={`${navBg} border-b sticky top-0 z-50 transition-colors`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Logo */}
          <BrandLogo />

          {/* Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              <Link to={getDashboardLink()} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${link}`}>
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <Link to="/problems" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${link}`}>
                <BookOpen className="w-3.5 h-3.5" /> Problems
              </Link>
              <Link to="/compiler" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${link}`}>
                <Code2 className="w-3.5 h-3.5" /> Compiler
              </Link>
              <Link to="/studyplans" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${link}`}>
                <GraduationCap className="w-3.5 h-3.5" /> Study Plans
              </Link>
              <Link to="/contests" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${link}`}>
                <Trophy className="w-3.5 h-3.5" /> Tests
              </Link>
              {user.role === 'COMPANY' && (
                <Link to="/company" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${link}`}>
                  <Building2 className="w-3.5 h-3.5" /> Hiring
                </Link>
              )}
              {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                <Link to={user.role === 'ADMIN' ? '/admin/batches' : '/teacher/students'} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${link}`}>
                  <Users className="w-3.5 h-3.5" /> Students
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${link}`}>
                  <Settings className="w-3.5 h-3.5" /> Admin
                </Link>
              )}
            </div>
          )}

          {/* Right — notifications, theme, user */}
          <div className="flex items-center gap-1.5 shrink-0">
            {user && <NotificationBell />}
            <button onClick={toggleTheme}
              className={`p-1.5 rounded-md transition-all ${icon}`}
              title={light ? 'Dark Mode' : 'Light Mode'}>
              {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-1" ref={profileMenuRef}>
                {/* Profile button — opens dropdown */}
                <button
                  onClick={() => setShowProfileMenu(v => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all ${user_}`}>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white"
                    style={{background:'#ffa116'}}>
                    {user.fullName?.charAt(0)}
                  </div>
                  <span className={`text-xs hidden sm:inline ${uName}`}>{user.fullName?.split(' ')[0]}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold hidden sm:inline"
                    style={{background:'rgba(255,161,22,0.15)', color:'#ffa116'}}>
                    {user.role}
                  </span>
                </button>

                {/* Logout icon */}
                <button onClick={() => setShowLogoutModal(true)}
                  className={`p-1.5 rounded-md transition-all ${light ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-[#6b6b6b] hover:text-[#ef4743] hover:bg-white/5'}`}
                  title="Logout">
                  <LogOut className="w-3.5 h-3.5" />
                </button>

                {/* Profile dropdown */}
                {showProfileMenu && (
                  <div className={`absolute top-14 right-4 z-50 w-72 rounded-2xl shadow-2xl border p-4 ${light ? 'bg-white border-gray-200' : 'bg-[#1e1e1e] border-[#3e3e3e]'}`}>
                    {/* User info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                        style={{background: 'linear-gradient(135deg,#ffa116,#ff6b35)'}}>
                        {user.fullName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${light ? 'text-gray-900' : 'text-white'}`}>{user.fullName}</p>
                        <p className={`text-[11px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>@{user.username || user.fullName?.toLowerCase().replace(' ','_')}</p>
                      </div>
                    </div>

                    {/* Quick tiles */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { to: '/profile', icon: '👤', label: 'Profile', bg: 'from-indigo-500 to-blue-600' },
                        { to: '/progress', icon: '📊', label: 'Progress', bg: 'from-teal-500 to-cyan-600' },
                        { to: '/studyplans', icon: '📚', label: 'Study Plans', bg: 'from-violet-500 to-purple-600' },
                      ].map(item => (
                        <Link key={item.to} to={item.to}
                          onClick={() => setShowProfileMenu(false)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${light ? 'hover:bg-gray-50 border border-gray-100' : 'hover:bg-white/5 border border-[#3e3e3e]'}`}>
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center text-lg`}>
                            {item.icon}
                          </div>
                          <span className={`text-[11px] font-medium ${light ? 'text-gray-600' : 'text-slate-400'}`}>{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Divider + logout */}
                    <div className={`border-t pt-2 ${light ? 'border-gray-100' : 'border-[#3e3e3e]'}`}>
                      <button
                        onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${light ? 'text-red-500 hover:bg-red-50' : 'text-[#ef4743] hover:bg-white/5'}`}>
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className={`text-xs px-3 py-1.5 transition-colors ${light ? 'text-gray-600 hover:text-gray-900' : 'text-[#a0a0a0] hover:text-white'}`}>
                  Login
                </Link>
                <Link to="/register"
                  className="text-xs px-3 py-1.5 rounded-md font-semibold text-white transition-all hover:opacity-90"
                  style={{background:'#ffa116'}}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>

    {/* ── Logout Confirmation Modal ── */}
    {showLogoutModal && (
      <div className="fixed inset-0 z-[999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
        <div className={`relative z-10 w-80 rounded-2xl shadow-2xl p-6 ${light ? 'bg-white border border-gray-200' : 'bg-[#1e1e1e] border border-[#3e3e3e]'}`}>
          <button onClick={() => setShowLogoutModal(false)}
            className={`absolute top-3 right-3 p-1 rounded-md transition-colors ${light ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}>
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className={`text-base font-bold text-center mb-1 ${light ? 'text-gray-900' : 'text-white'}`}>Log out?</h3>
          <p className={`text-sm text-center mb-6 ${light ? 'text-gray-500' : 'text-slate-400'}`}>
            Are you sure you want to log out of your account?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowLogoutModal(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${light ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-[#3e3e3e] text-slate-300 hover:bg-white/5'}`}>
              Cancel
            </button>
            <button onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

