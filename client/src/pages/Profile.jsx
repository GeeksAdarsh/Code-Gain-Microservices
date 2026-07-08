import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MapPin, GraduationCap, Calendar, Code2, CheckCircle2, Clock, BookOpen, ArrowRight, Github, Linkedin, Twitter, Globe, Edit3, Save, X, Flame, AtSign, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { profileAPI } from '../services/api';
import { useRef } from 'react';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'light';
  const [profile, setProfile] = useState(null);
  const [studyPlans, setStudyPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Username editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // { available, reason }
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const usernameTimer = useRef(null);

  useEffect(() => { loadProfile(); }, [username]);

  const loadProfile = async () => {
    try {
      const endpoint = username ? `/profile/${username}` : '/profile/me';
      const [profileRes, plansRes] = await Promise.all([api.get(endpoint), api.get('/studyplans')]);
      setProfile(profileRes.data);
      setStudyPlans(plansRes.data);
      setEditForm({
        fullName: profileRes.data.fullName || '', bio: profileRes.data.bio || '',
        profileImage: profileRes.data.profileImage || '', githubUrl: profileRes.data.githubUrl || '',
        linkedinUrl: profileRes.data.linkedinUrl || '', twitterUrl: profileRes.data.twitterUrl || '',
        websiteUrl: profileRes.data.websiteUrl || '', location: profileRes.data.location || '',
        university: profileRes.data.university || '', department: profileRes.data.department || '',
      });
    } catch (err) { toast.error('Failed to load profile'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      await api.put('/profile/update', editForm);
      toast.success('Profile updated!');
      setEditing(false);
      loadProfile();
    } catch (err) { toast.error('Failed to update'); }
  };

  const startUsernameEdit = () => {
    setNewUsername(profile.username);
    setUsernameStatus(null);
    setEditingUsername(true);
  };

  const onUsernameChange = (val) => {
    setNewUsername(val);
    setUsernameStatus(null);
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    const trimmed = val.trim();
    if (!trimmed) return;
    setCheckingUsername(true);
    usernameTimer.current = setTimeout(async () => {
      try {
        const res = await profileAPI.checkUsername(trimmed);
        setUsernameStatus(res.data);
      } catch {
        setUsernameStatus({ available: false, reason: 'Could not check username' });
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
  };

  const saveUsername = async () => {
    const trimmed = newUsername.trim();
    if (trimmed === profile.username) { setEditingUsername(false); return; }
    setSavingUsername(true);
    try {
      const res = await profileAPI.updateUsername(trimmed);
      updateUser({ username: res.data.username }, res.data.token);
      toast.success('Username updated!');
      setEditingUsername(false);
      setUsernameStatus(null);
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!profile) return <div className="text-center text-slate-400 py-20">Profile not found</div>;

  const isOwner = currentUser?.username === (profile.username);

  // Heatmap — LeetCode style (grouped by month, each month has correct day count)
  const getHeatColor = (c) => {
    if (c === 0) return light ? 'bg-gray-200' : 'bg-slate-800';
    if (c === 1) return light ? 'bg-emerald-200' : 'bg-emerald-900';
    if (c <= 3)  return light ? 'bg-emerald-400' : 'bg-emerald-700';
    if (c <= 5)  return light ? 'bg-emerald-500' : 'bg-emerald-500';
    return light ? 'bg-emerald-600' : 'bg-emerald-400';
  };

  const buildHeatmap = () => {
    const today = new Date();
    const months = [];

    for (let m = 11; m >= 0; m--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDow = monthStart.getDay();

      const columns = [];
      let col = Array(7).fill(null);

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dow = date.getDay();
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isFuture = date > today;

        col[dow] = {
          date: key,
          count: isFuture ? -1 : (profile.heatmap?.[key] || 0),
          isFuture,
        };

        if (dow === 6 || day === daysInMonth) {
          columns.push(col);
          col = Array(7).fill(null);
        }
      }

      months.push({
        label: monthStart.toLocaleString('en', { month: 'short' }),
        columns,
        daysInMonth,
      });
    }

    return months;
  };

  const heatMonths = buildHeatmap();
  const timeSince = (d) => { if (!d) return ''; const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff/60000); if (m<60) return `${m}m ago`; const h = Math.floor(m/60); if (h<24) return `${h}h ago`; const dy = Math.floor(h/24); return dy < 30 ? `${dy}d ago` : `${Math.floor(dy/30)}mo ago`; };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-12 gap-5">

        {/* LEFT — Profile Info */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-start gap-3 mb-4">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
                  {profile.fullName?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <h1 className={`text-lg font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{profile.fullName}</h1>
                <p className={`text-sm ${light ? 'text-gray-500' : 'text-slate-400'}`}>@{profile.username}</p>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  profile.role==='ADMIN'?'bg-red-500/20 text-red-400':profile.role==='TEACHER'?'bg-blue-500/20 text-blue-400':profile.role==='COMPANY'?'bg-purple-500/20 text-purple-400':'bg-emerald-500/20 text-emerald-400'
                }`}>{profile.role}</span>
              </div>
            </div>

            {profile.bio && <p className={`text-sm mb-3 ${light ? 'text-gray-600' : 'text-slate-300'}`}>{profile.bio}</p>}

            {isOwner && !editing && (
              <div className="flex gap-2 mb-3">
                <button onClick={() => setEditing(true)} className="flex-1 py-2 text-sm font-medium text-[#ffa116] border border-[#ffa116]/30 rounded-xl hover:bg-[#ffa116]/10 flex items-center justify-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button onClick={startUsernameEdit} className={`py-2 px-3 text-sm rounded-xl border flex items-center gap-1.5 ${light ? 'text-gray-500 border-gray-300 hover:bg-gray-100' : 'text-slate-400 border-[#3e3e3e] hover:bg-[#282828]'}`} title="Change Username">
                  <AtSign className="w-4 h-4" />
                </button>
                <button onClick={() => {
                  const current = prompt('Enter current password:');
                  if (!current) return;
                  const newPw = prompt('Enter new password (min 6 chars):');
                  if (!newPw || newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
                  profileAPI.changePassword(current, newPw)
                    .then(() => toast.success('Password changed!'))
                    .catch(err => toast.error(err.response?.data?.error || 'Failed to change password'));
                }} className={`py-2 px-3 text-sm rounded-xl border flex items-center gap-1.5 ${light ? 'text-gray-500 border-gray-300 hover:bg-gray-100' : 'text-slate-400 border-[#3e3e3e] hover:bg-[#282828]'}`} title="Change Password">
                  🔑
                </button>
              </div>
            )}

            {/* Username editor */}
            {isOwner && editingUsername && (
              <div className={`space-y-2 mb-3 p-3 rounded-xl border ${light ? 'bg-gray-50 border-gray-200' : 'bg-[#282828]/50 border-[#3e3e3e]'}`}>
                <label className={`block text-[11px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>Change username</label>
                <div className="flex items-center gap-2 input-field text-sm py-2">
                  <AtSign className={`w-4 h-4 flex-shrink-0 ${light ? 'text-gray-400' : 'text-slate-500'}`} />
                  <input
                    className="bg-transparent outline-none flex-1"
                    value={newUsername}
                    onChange={(e) => onUsernameChange(e.target.value)}
                    placeholder="new_username"
                    autoFocus
                    maxLength={20}
                  />
                  {checkingUsername && <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />}
                </div>
                {usernameStatus && !checkingUsername && (
                  <p className={`text-xs flex items-center gap-1 ${usernameStatus.available ? 'text-emerald-400' : 'text-red-400'}`}>
                    {usernameStatus.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {usernameStatus.reason}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveUsername}
                    disabled={savingUsername || checkingUsername || !usernameStatus?.available || newUsername.trim() === profile.username}
                    className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                  </button>
                  <button
                    onClick={() => { setEditingUsername(false); setUsernameStatus(null); }}
                    className={`py-2 px-3 text-sm rounded-xl border ${light ? 'text-gray-500 border-gray-300 hover:bg-gray-100' : 'text-slate-400 border-[#3e3e3e] hover:bg-[#282828]'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {editing && (
              <div className={`space-y-2 mb-4 p-3 rounded-xl border ${light ? 'bg-gray-50 border-gray-200' : 'bg-[#282828]/50 border-[#3e3e3e]'}`}>
                <input className="input-field text-sm py-2" placeholder="Full Name" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
                <textarea className="input-field text-sm py-2 min-h-[60px]" placeholder="Bio" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Profile Photo (JPEG/PNG, max 1MB)</label>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/jpeg,image/png"
                      className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-amber-600 file:text-white file:cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 1048576) { toast.error('File too large. Max 1MB.'); return; }
                        const fd = new FormData(); fd.append('file', file);
                        try {
                          const res = await api.post('/profile/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                          toast.success('Photo uploaded!');
                          setEditForm({ ...editForm, profileImage: res.data.imageUrl });
                          loadProfile();
                        } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
                      }} />
                    {profile.profileImage && (
                      <button type="button" onClick={async () => {
                        try {
                          await api.delete('/profile/remove-image');
                          toast.success('Photo removed');
                          setEditForm({ ...editForm, profileImage: null });
                          loadProfile();
                        } catch (err) { toast.error('Failed to remove photo'); }
                      }} className="text-[11px] text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all whitespace-nowrap">
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
                <input className="input-field text-sm py-2" placeholder="📍 Location (e.g. India)" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                <input className="input-field text-sm py-2" placeholder="🎓 University" value={editForm.university} onChange={e => setEditForm({...editForm, university: e.target.value})} />
                <input className="input-field text-sm py-2" placeholder="GitHub URL" value={editForm.githubUrl} onChange={e => setEditForm({...editForm, githubUrl: e.target.value})} />
                <input className="input-field text-sm py-2" placeholder="LinkedIn URL" value={editForm.linkedinUrl} onChange={e => setEditForm({...editForm, linkedinUrl: e.target.value})} />
                <input className="input-field text-sm py-2" placeholder="Twitter/X URL" value={editForm.twitterUrl} onChange={e => setEditForm({...editForm, twitterUrl: e.target.value})} />
                <input className="input-field text-sm py-2" placeholder="Website URL" value={editForm.websiteUrl} onChange={e => setEditForm({...editForm, websiteUrl: e.target.value})} />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="btn-primary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => setEditing(false)} className="btn-secondary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              </div>
            )}

            {/* Info Items */}
            <div className="space-y-2 text-sm">
              {(profile.location) && <div className={`flex items-center gap-2 ${light ? 'text-gray-500' : 'text-slate-400'}`}><MapPin className={`w-4 h-4 ${light ? 'text-gray-400' : 'text-slate-500'}`} />{profile.location}</div>}
              {(profile.university || profile.department) && <div className={`flex items-center gap-2 ${light ? 'text-gray-500' : 'text-slate-400'}`}><GraduationCap className={`w-4 h-4 ${light ? 'text-gray-400' : 'text-slate-500'}`} />{profile.university || profile.department}</div>}
              <div className={`flex items-center gap-2 ${light ? 'text-gray-500' : 'text-slate-400'}`}><Calendar className={`w-4 h-4 ${light ? 'text-gray-400' : 'text-slate-500'}`} />Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : 'Recently'}</div>
            </div>

            {/* Social Links */}
            {(profile.githubUrl || profile.linkedinUrl || profile.twitterUrl || profile.websiteUrl) && (
              <div className={`flex gap-2 mt-3 pt-3 border-t ${light ? 'border-gray-200' : 'border-slate-700/50'}`}>
                {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className={`p-2 rounded-lg transition-colors ${light ? 'bg-gray-100 text-gray-500 hover:text-gray-900' : 'bg-[#282828] text-slate-400 hover:text-white'}`}><Github className="w-4 h-4" /></a>}
                {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className={`p-2 rounded-lg transition-colors ${light ? 'bg-gray-100 text-gray-500 hover:text-blue-600' : 'bg-[#282828] text-slate-400 hover:text-blue-400'}`}><Linkedin className="w-4 h-4" /></a>}
                {profile.twitterUrl && <a href={profile.twitterUrl} target="_blank" rel="noreferrer" className={`p-2 rounded-lg transition-colors ${light ? 'bg-gray-100 text-gray-500 hover:text-sky-500' : 'bg-[#282828] text-slate-400 hover:text-sky-400'}`}><Twitter className="w-4 h-4" /></a>}
                {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className={`p-2 rounded-lg transition-colors ${light ? 'bg-gray-100 text-gray-500 hover:text-emerald-600' : 'bg-[#282828] text-slate-400 hover:text-emerald-400'}`}><Globe className="w-4 h-4" /></a>}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="glass-card p-4 space-y-2.5">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${light ? 'text-gray-400' : 'text-slate-500'}`}>Stats</h3>
            {[
              {l:'Submissions',v:profile.totalSubmissions||0,icon:'📝'},
              {l:'Accepted',v:profile.acceptedSubmissions||0,icon:'✅'},
              {l:'Active Days',v:profile.totalActiveDays||0,icon:'📅'},
              {l:'Max Streak',v:profile.maxStreak||0,icon:'🔥'},
              {l:'Current Streak',v:profile.currentStreak||0,icon:'⚡'},
            ].map((s,i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className={light ? 'text-gray-500' : 'text-slate-400'}>{s.icon} {s.l}</span>
                <span className={`font-medium ${light ? 'text-gray-900' : 'text-white'}`}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* Languages */}
          <div className="glass-card p-4">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${light ? 'text-gray-400' : 'text-slate-500'}`}>Languages</h3>
            {profile.languages && Object.keys(profile.languages).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(profile.languages).sort((a,b)=>b[1]-a[1]).map(([l,c]) => (
                  <div key={l} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${l==='JAVA'?'bg-orange-500':l==='PYTHON'?'bg-blue-500':l==='CPP'?'bg-violet-500':l==='C'?'bg-cyan-500':'bg-yellow-500'}`}></div>
                      <span className={`text-sm ${light ? 'text-gray-700' : 'text-slate-300'}`}>{l}</span>
                    </div>
                    <span className={`text-xs ${light ? 'text-gray-400' : 'text-slate-500'}`}>{c} solved</span>
                  </div>
                ))}
              </div>
            ) : <p className={`text-xs ${light ? 'text-gray-400' : 'text-slate-600'}`}>No submissions yet</p>}
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Solved Card */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-8">
              <div className="relative w-36 h-36 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke={light ? '#e5e7eb' : '#282828'} strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#00b8a3" strokeWidth="10" strokeDasharray={`${(profile.easySolved/Math.max(profile.totalQuestions,1))*314} 314`} strokeLinecap="round" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#ffc01e" strokeWidth="10" strokeDasharray={`${(profile.mediumSolved/Math.max(profile.totalQuestions,1))*314} 314`} strokeDashoffset={`${-(profile.easySolved/Math.max(profile.totalQuestions,1))*314}`} strokeLinecap="round" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4743" strokeWidth="10" strokeDasharray={`${(profile.hardSolved/Math.max(profile.totalQuestions,1))*314} 314`} strokeDashoffset={`${-((profile.easySolved+profile.mediumSolved)/Math.max(profile.totalQuestions,1))*314}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{profile.totalSolved}</span>
                  <span className={`text-[10px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>/{profile.totalQuestions}</span>
                  <span className="text-[10px] text-[#00b8a3] flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Solved</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {[{l:'Easy',s:profile.easySolved,t:profile.easyTotal,c:'bg-[#00b8a3]',tc:'text-[#00b8a3]'},{l:'Med.',s:profile.mediumSolved,t:profile.mediumTotal,c:'bg-[#ffc01e]',tc:'text-[#ffc01e]'},{l:'Hard',s:profile.hardSolved,t:profile.hardTotal,c:'bg-[#ef4743]',tc:'text-[#ef4743]'}].map(d => (
                  <div key={d.l}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm font-medium ${d.tc}`}>{d.l}</span>
                      <span className={`text-sm font-mono ${light ? 'text-gray-700' : 'text-slate-300'}`}>{d.s}/{d.t}</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${light ? 'bg-gray-200' : 'bg-[#3e3e3e]'}`}>
                      <div className={`h-full ${d.c} rounded-full transition-all duration-1000`} style={{width:`${d.t>0?(d.s/d.t)*100:0}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${light ? 'text-gray-700' : 'text-slate-300'}`}>Badges <span className="text-indigo-400">{profile.badges.length}</span></h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {profile.badges.map((b, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    b.tier==='platinum'?'bg-violet-500/10 border-violet-500/30':
                    b.tier==='gold'?'bg-amber-500/10 border-amber-500/30':
                    b.tier==='silver'?'bg-slate-400/10 border-slate-400/30':
                    'bg-orange-500/10 border-orange-500/30'
                  }`} title={b.description}>
                    <span className="text-xl">{b.icon}</span>
                    <div>
                      <p className={`text-xs font-medium ${light ? 'text-gray-800' : 'text-white'}`}>{b.name}</p>
                      <p className={`text-[10px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${light ? 'text-gray-700' : 'text-slate-300'}`}>
                <Flame className="w-4 h-4 text-orange-400" />
                {profile.totalSubmissions||0} submissions in the past year
              </h3>
              <div className={`flex items-center gap-3 text-[11px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>
                <span>Active: <span className={`font-medium ${light ? 'text-gray-800' : 'text-white'}`}>{profile.totalActiveDays||0}</span></span>
                <span>Streak: <span className={`font-medium ${light ? 'text-gray-800' : 'text-white'}`}>{profile.maxStreak||0}</span></span>
              </div>
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-0.5">
                <div className="flex flex-col gap-[3px] mr-1 pt-[18px]">
                  {['','Mon','','Wed','','Fri',''].map((d,i) => (
                    <span key={i} className={`text-[9px] h-[11px] leading-[11px] ${light ? 'text-gray-400' : 'text-slate-600'}`}>{d}</span>
                  ))}
                </div>
                <div className="flex gap-[6px] min-w-[660px]">
                  {heatMonths.map((month, mi) => (
                    <div key={mi} className="flex flex-col items-center">
                      <span className={`text-[10px] mb-1 h-[14px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>{month.label}</span>
                      <div className="flex gap-[3px]">
                        {month.columns.map((col, ci) => (
                          <div key={ci} className="flex flex-col gap-[3px]">
                            {col.map((cell, ri) => (
                              <div key={ri}
                                className={`w-[11px] h-[11px] rounded-[2px] ${
                                  cell === null ? 'bg-transparent' :
                                  cell.isFuture ? 'bg-transparent' :
                                  getHeatColor(cell.count)
                                }`}
                                title={cell ? (cell.isFuture ? '' : `${cell.date}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}`) : ''}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span className={`text-[9px] ${light ? 'text-gray-400' : 'text-slate-600'}`}>Less</span>
              {(light
                ? ['bg-gray-200','bg-emerald-200','bg-emerald-400','bg-emerald-500','bg-emerald-600']
                : ['bg-slate-800','bg-emerald-900','bg-emerald-700','bg-emerald-500','bg-emerald-400']
              ).map((c,i) => <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`}></div>)}
              <span className={`text-[9px] ${light ? 'text-gray-400' : 'text-slate-600'}`}>More</span>
            </div>
          </div>

          {/* Study Plans */}
          {studyPlans.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${light ? 'text-gray-700' : 'text-slate-300'}`}><BookOpen className="w-4 h-4 text-indigo-400" /> Study Plans</h3>
                <Link to="/studyplans" className="text-[11px] text-[#ffa116] hover:opacity-80 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {studyPlans.slice(0, 6).map(plan => (
                  <Link key={plan.id} to={`/studyplan/${plan.id}`} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${light ? 'bg-gray-50 border-gray-200 hover:border-[#ffa116]/40' : 'bg-[#282828]/40 border-[#3e3e3e]/50 hover:border-[#ffa116]/20'}`}>
                    <span className="text-lg">{plan.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-medium truncate ${light ? 'text-gray-800' : 'text-white'}`}>{plan.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`flex-1 h-1 rounded-full overflow-hidden ${light ? 'bg-gray-200' : 'bg-[#3e3e3e]'}`}>
                          <div className={`h-full bg-gradient-to-r ${plan.color} rounded-full`} style={{width:`${plan.progress}%`}}></div>
                        </div>
                        <span className={`text-[9px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>{plan.solvedQuestions}/{plan.totalQuestions}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          <div className="glass-card overflow-hidden">
            <div className={`flex border-b ${light ? 'border-gray-200' : 'border-slate-700/50'}`}>
              {[{k:'recent',l:'Recent AC',i:<CheckCircle2 className="w-3.5 h-3.5"/>},{k:'all',l:'All',i:<Code2 className="w-3.5 h-3.5"/>}].map(tab => (
                <button key={tab.k} onClick={() => setActiveTab(tab.k)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px ${
                    activeTab===tab.k
                      ? `text-white border-[#ffa116] ${light ? 'bg-gray-50 text-gray-900' : 'bg-white/5'}`
                      : `border-transparent ${light ? 'text-gray-400 hover:text-gray-700' : 'text-slate-400 hover:text-slate-300'}`
                  }`}>{tab.i} {tab.l}</button>
              ))}
            </div>
            <div className={`divide-y ${light ? 'divide-gray-100' : 'divide-slate-800/50'}`}>
              {(() => {
                const list = activeTab === 'recent'
                  ? (profile.recentAccepted || [])
                  : (profile.recentSubmissions || []);
                return list.length > 0 ? (
                  list.map((sub, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-2.5 transition-colors ${light ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]'}`}>
                      <div className="flex items-center gap-2.5">
                        <span className={sub.status==='ACCEPTED' ? 'text-[#00b8a3]' : 'text-red-400'}>
                          {sub.status==='ACCEPTED' ? <CheckCircle2 className="w-4 h-4"/> : <Clock className="w-4 h-4"/>}
                        </span>
                        <span className={`text-sm ${light ? 'text-gray-800' : 'text-white'}`}>{sub.questionTitle}</span>
                        {sub.language && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${light ? 'bg-gray-100 text-gray-500' : 'bg-[#282828] text-slate-500'}`}>
                            {sub.language}
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] ${light ? 'text-gray-400' : 'text-slate-500'}`}>{timeSince(sub.submittedAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Code2 className={`w-8 h-8 mx-auto mb-2 ${light ? 'text-gray-300' : 'text-slate-700'}`} />
                    <p className={`text-xs ${light ? 'text-gray-400' : 'text-slate-500'}`}>{activeTab === 'recent' ? 'No solved questions yet' : 'No submissions yet'}</p>
                    <Link to="/problems" className="text-[#ffa116] text-xs hover:opacity-80 mt-1 inline-block">Start solving →</Link>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
