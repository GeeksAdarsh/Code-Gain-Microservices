import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { questionAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, Shuffle, BookOpen, Star, Trophy, Calendar, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const PER_PAGE = 50;

const CATEGORIES = [
  { key: 'all', label: 'All Topics', icon: '📋' },
  { key: 'algorithms', label: 'Algorithms', icon: '🧠' },
  { key: 'strings', label: 'Strings', icon: '📝' },
  { key: 'trees', label: 'Trees', icon: '🌳' },
  { key: 'graphs', label: 'Graphs', icon: '🌐' },
  { key: 'dp', label: 'Dynamic Programming', icon: '⚡' },
  { key: 'backtracking', label: 'Backtracking', icon: '🔙' },
];

/* ── Favorites helpers (localStorage, keyed per user) ───────────── */
const favKey = (userId) => `favorites_${userId || 'guest'}`;
const loadFavs = (userId) => { try { return new Set(JSON.parse(localStorage.getItem(favKey(userId)) || '[]')); } catch { return new Set(); } };
const saveFavs = (userId, set) => { try { localStorage.setItem(favKey(userId), JSON.stringify([...set])); } catch {} };

export default function Problems() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const [questions, setQuestions]     = useState([]);
  const [search, setSearch]           = useState('');
  const [difficulty, setDifficulty]   = useState('ALL');
  const [selectedTag, setSelectedTag] = useState(null);
  const [category, setCategory]       = useState('all');
  const [page, setPage]               = useState(1);
  const [showAllTags, setShowAllTags] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [solvedCount, setSolvedCount] = useState(0);
  const [solvedIds, setSolvedIds]     = useState(new Set());
  const [favorites, setFavorites]     = useState(() => loadFavs(user?.id));
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => { loadQuestions(); }, []);

  // Reload favorites when user changes
  useEffect(() => { setFavorites(loadFavs(user?.id)); }, [user?.id]);

  const loadQuestions = async () => {
    try {
      const [qRes, pRes] = await Promise.all([
        questionAPI.getAll(),
        api.get('/profile/me').catch(() => ({ data: { totalSolved: 0, solvedQuestionIds: [] } })),
      ]);
      setQuestions(qRes.data);
      setSolvedCount(pRes.data.totalSolved || 0);
      if (pRes.data.solvedQuestionIds) setSolvedIds(new Set(pRes.data.solvedQuestionIds));
    } catch (err) { toast.error('Failed to load problems'); }
    finally { setLoading(false); }
  };

  const toggleFavorite = useCallback((qId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(qId)) { next.delete(qId); toast('Removed from favorites', { icon: '☆' }); }
      else               { next.add(qId);    toast.success('Added to favorites ⭐'); }
      saveFavs(user?.id, next);
      return next;
    });
  }, [user?.id]);

  const tagCounts = useMemo(() => {
    const c = {}; questions.forEach(q => q.tags?.forEach(t => { c[t] = (c[t]||0)+1; }));
    return Object.entries(c).sort((a,b) => b[1]-a[1]);
  }, [questions]);

  const filtered = useMemo(() => {
    let r = questions;
    if (showFavorites) r = r.filter(q => favorites.has(q.id));
    if (search) { const s = search.toLowerCase(); r = r.filter(q => q.title.toLowerCase().includes(s) || q.tags?.some(t => t.toLowerCase().includes(s))); }
    if (difficulty !== 'ALL') r = r.filter(q => q.difficulty === difficulty);
    if (selectedTag) r = r.filter(q => q.tags?.includes(selectedTag));
    if (category !== 'all') {
      const catMap = { algorithms:['Array','Two Pointers','Sorting','Binary Search','Greedy','Math','Bit Manipulation','Heap','Stack','Queue','Design'], strings:['String','Sliding Window'], backtracking:['Backtracking'], trees:['Tree','BST','DFS','BFS'], graphs:['Graph','Union Find','Topological Sort','Dijkstra','Shortest Path'], dp:['DP','Dynamic Programming','Memoization'] };
      const tags = catMap[category] || [];
      r = r.filter(q => q.tags?.some(t => tags.includes(t)));
    }
    return r;
  }, [questions, search, difficulty, selectedTag, category, showFavorites, favorites]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const diffCounts = useMemo(() => ({ EASY: questions.filter(q=>q.difficulty==='EASY').length, MEDIUM: questions.filter(q=>q.difficulty==='MEDIUM').length, HARD: questions.filter(q=>q.difficulty==='HARD').length }), [questions]);

  useEffect(() => { setPage(1); }, [search, difficulty, selectedTag, category, showFavorites]);

  // Calendar
  const today = new Date();
  const calMonth = today.toLocaleString('en', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4">
      <div className="flex gap-5">

        {/* LEFT SIDEBAR — hidden on mobile & tablet */}
        <div className="w-44 flex-shrink-0 space-y-3 hidden xl:block">
          <Link to="/studyplans" className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all text-sm">
            <BookOpen className="w-4 h-4" /> Study Plan
          </Link>
          <div className="border-t border-slate-800 pt-2">
            <p className="text-xs text-slate-600 px-3 mb-2">My Lists</p>
            <button
              onClick={() => setShowFavorites(v => !v)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                showFavorites
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
              }`}>
              <span className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${showFavorites ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
                Favorite
              </span>
              {favorites.size > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full px-1.5 py-0.5 font-semibold">
                  {favorites.size}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MAIN CONTENT — always visible, takes remaining space */}
        <div className="flex-1 min-w-0">
          {/* Topic Tags */}
          <div className="mb-3">
            <div className={`flex flex-wrap gap-x-3 gap-y-1 ${showAllTags ? '' : 'max-h-[22px] overflow-hidden'}`}>
              {tagCounts.map(([tag, count]) => (
                <button key={tag} onClick={() => setSelectedTag(selectedTag===tag?null:tag)}
                  className={`text-xs whitespace-nowrap transition-colors ${selectedTag===tag?'text-indigo-400 font-semibold':'text-slate-400 hover:text-white'}`}>
                  {tag} <span className="text-slate-600">{count}</span>
                </button>
              ))}
            </div>
            {tagCounts.length > 8 && <button onClick={() => setShowAllTags(!showAllTags)} className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-0.5">{showAllTags ? 'Collapse ↑' : `Expand ↓`}</button>}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setCategory(cat.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  category===cat.key ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}>
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" className="input-field pl-9 py-2 text-sm" placeholder="Search questions" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => { const rq = questions[Math.floor(Math.random()*questions.length)]; if (rq) navigate(`/problem/${rq.id}`); }} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all" title="Random"><Shuffle className="w-4 h-4" /></button>
          </div>

          {/* Solved counter + difficulty */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{solvedCount}/{questions.length} Solved</span>
            <div className="flex gap-1">
              {[{k:'ALL',l:'All',c:diffCounts.EASY+diffCounts.MEDIUM+diffCounts.HARD},{k:'EASY',l:'Easy',c:diffCounts.EASY,cl:'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'},{k:'MEDIUM',l:'Med.',c:diffCounts.MEDIUM,cl:'text-amber-400 border-amber-500/30 bg-amber-500/10'},{k:'HARD',l:'Hard',c:diffCounts.HARD,cl:'text-red-400 border-red-500/30 bg-red-500/10'}].map(d => (
                <button key={d.k} onClick={() => setDifficulty(d.k)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${difficulty===d.k ? d.cl||'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : 'text-slate-500 border-slate-800 hover:text-white'}`}>
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          {/* Favorites active banner */}
          {showFavorites && (
            <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> Showing {favorites.size} favorite{favorites.size !== 1 ? 's' : ''}
              </span>
              <button onClick={() => setShowFavorites(false)} className="text-[10px] text-amber-500 hover:text-amber-300 font-medium">Show all</button>
            </div>
          )}

          {/* Problems List */}
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-slate-800/40">
              {paginated.map((q, i) => {
                const idx = (page-1)*PER_PAGE+i+1;
                const solved = solvedIds.has(q.id);
                return (
                  <div key={q.id} className="flex items-center hover:bg-slate-800/30 transition-colors group">
                    <Link to={`/problem/${q.id}`}
                      className="flex items-center flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-3">
                      <div className="w-5 flex-shrink-0">
                        {solved ? <CheckCircle2 className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-emerald-400" /> : <div className="w-4 h-4 sm:w-[17px] sm:h-[17px] rounded-full border-2 border-slate-700"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm text-slate-200 group-hover:text-white truncate block">
                          <span className="text-slate-500 mr-1">{idx}.</span>{q.title}
                        </span>
                      </div>
                      <span className={`text-[11px] sm:text-xs font-medium flex-shrink-0 ${q.difficulty==='EASY'?'text-emerald-400':q.difficulty==='HARD'?'text-red-400':'text-amber-400'}`}>
                        {q.difficulty==='EASY'?'Easy':q.difficulty==='HARD'?'Hard':'Med.'}
                      </span>
                    </Link>
                    {canEdit && (
                      <Link to={`/teacher/edit-question/${q.id}`} title="Edit question & test cases"
                        className="flex-shrink-0 px-2 py-2 text-slate-500 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Pencil className="w-4 h-4" />
                      </Link>
                    )}
                    {/* Favorite star — visible on hover or if already favorited */}
                    <button
                      onClick={(e) => toggleFavorite(q.id, e)}
                      title={favorites.has(q.id) ? 'Remove from favorites' : 'Add to favorites'}
                      className={`flex-shrink-0 px-2 py-2 transition-colors ${
                        favorites.has(q.id)
                          ? 'text-amber-400'
                          : 'text-slate-700 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                      }`}>
                      <Star className={`w-4 h-4 ${favorites.has(q.id) ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                );
              })}
              {paginated.length === 0 && (
                <div className="py-12 text-center">
                  {showFavorites ? (
                    <>
                      <Star className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-medium">No favorites yet</p>
                      <p className="text-slate-600 text-xs mt-1">Click the ⭐ on any problem to save it here</p>
                      <button onClick={() => setShowFavorites(false)} className="mt-3 text-xs text-amber-500 hover:text-amber-400 font-medium">Browse all problems</button>
                    </>
                  ) : (
                    <p className="text-slate-500 text-sm">No problems found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <button onClick={() => setPage(Math.max(1,page-1))} disabled={page===1} className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-all"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({length:Math.min(totalPages,7)},(_,i) => {
                let pn; if(totalPages<=7) pn=i+1; else if(page<=4) pn=i+1; else if(page>=totalPages-3) pn=totalPages-6+i; else pn=page-3+i;
                return <button key={i} onClick={() => setPage(pn)} className={`w-8 h-8 rounded text-xs font-medium transition-all ${page===pn?'bg-indigo-600 text-white':'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>{pn}</button>;
              })}
              <button onClick={() => setPage(Math.min(totalPages,page+1))} disabled={page===totalPages} className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR — hidden on mobile, shown on large screens */}
        <div className="w-72 flex-shrink-0 space-y-4 hidden lg:block">
          {/* Calendar */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{calMonth}</h3>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="text-[10px] text-slate-500 font-medium py-1">{d}</span>)}
              {Array.from({length:firstDay}).map((_,i) => <span key={`e${i}`}></span>)}
              {Array.from({length:daysInMonth},(_,i) => {
                const day = i+1;
                const isToday = day === today.getDate();
                return (
                  <span key={day} className={`text-xs py-1 rounded-full ${isToday ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}>
                    {day}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Study Plan CTA */}
          <Link to="/studyplans" className="glass-card p-4 flex items-center gap-3 hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Study Plans</p>
              <p className="text-[11px] text-slate-500">Blind 75, Top 150 & more</p>
            </div>
          </Link>

          {/* Stats */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Your Progress</h3>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-emerald-400">Easy</span><span className="text-slate-400">{Array.from(solvedIds).filter(id => questions.find(q=>q.id===id)?.difficulty==='EASY').length}/{diffCounts.EASY}</span></div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${diffCounts.EASY>0?(Array.from(solvedIds).filter(id=>questions.find(q=>q.id===id)?.difficulty==='EASY').length/diffCounts.EASY)*100:0}%`}}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-amber-400">Medium</span><span className="text-slate-400">{Array.from(solvedIds).filter(id => questions.find(q=>q.id===id)?.difficulty==='MEDIUM').length}/{diffCounts.MEDIUM}</span></div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{width:`${diffCounts.MEDIUM>0?(Array.from(solvedIds).filter(id=>questions.find(q=>q.id===id)?.difficulty==='MEDIUM').length/diffCounts.MEDIUM)*100:0}%`}}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-red-400">Hard</span><span className="text-slate-400">{Array.from(solvedIds).filter(id => questions.find(q=>q.id===id)?.difficulty==='HARD').length}/{diffCounts.HARD}</span></div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{width:`${diffCounts.HARD>0?(Array.from(solvedIds).filter(id=>questions.find(q=>q.id===id)?.difficulty==='HARD').length/diffCounts.HARD)*100:0}%`}}></div></div>
              </div>
            </div>
          </div>

          {/* Trending Tags */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Trending Topics</h3>
            <div className="flex flex-wrap gap-1.5">
              {tagCounts.slice(0, 12).map(([tag, count]) => (
                <button key={tag} onClick={() => { setSelectedTag(selectedTag===tag?null:tag); setPage(1); }}
                  className={`text-[11px] px-2 py-1 rounded-full border transition-all ${
                    selectedTag===tag ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' : 'text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                  }`}>
                  {tag} <span className="text-slate-600">{count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
