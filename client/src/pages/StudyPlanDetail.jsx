import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock, ExternalLink, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function StudyPlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const all = {};
    return all;
  });
  const [collapsedDiff, setCollapsedDiff] = useState({});
  const [allCollapsed, setAllCollapsed] = useState(true);

  useEffect(() => {
    if (plan?.questions && allCollapsed) {
      const groups = {};
      plan.questions.forEach(q => { const s = q.tags?.[0] || 'Other'; groups[s] = true; });
      setCollapsed(groups);
    }
  }, [plan]);

  useEffect(() => { loadPlan(); }, [planId]);

  const loadPlan = async () => {
    try {
      const res = await api.get(`/studyplans/${planId}`);
      setPlan(res.data);
    } catch (err) { toast.error('Failed to load study plan'); }
    finally { setLoading(false); }
  };

  // Group questions by their first tag (topic section)
  const sections = useMemo(() => {
    if (!plan?.questions) return [];
    const groups = {};
    const order = [];

    plan.questions.forEach(q => {
      // Use first tag as section name, or "Other"
      const section = q.tags?.[0] || 'Other';
      if (!groups[section]) {
        groups[section] = [];
        order.push(section);
      }
      groups[section].push(q);
    });

    return order.map(name => ({
      name,
      questions: groups[name],
      solved: groups[name].filter(q => q.solved).length,
      total: groups[name].length,
    }));
  }, [plan]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!plan) return <div className="text-center text-slate-400 py-20">Plan not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate('/studyplans')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Study Plans
      </button>

      {/* Header */}
      <div className="glass-card p-6 mb-6 relative overflow-hidden">
        <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${plan.color} opacity-10 rounded-full blur-3xl`}></div>
        <div className="relative flex items-center gap-6">
          <span className="text-5xl">{plan.icon}</span>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">📋 Study Plan</p>
            <h1 className="text-2xl font-bold text-white mb-1">{plan.name}</h1>
            <p className="text-sm text-slate-400 max-w-lg">{plan.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-white">{plan.solvedQuestions}</span>
              <span className="text-slate-500">/ {plan.totalQuestions}</span>
            </div>
            {/* Progress bar */}
            <div className="w-40 h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${plan.color} rounded-full transition-all duration-1000`}
                style={{ width: `${plan.progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content: Questions grouped by topic + Sidebar */}
      <div className="grid grid-cols-12 gap-6">

        {/* Main — Questions by Topic */}
        <div className="col-span-12 lg:col-span-8">
          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button onClick={() => setShowTags(!showTags)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
              {showTags ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showTags ? 'Hide tags' : 'Show tags'}
            </button>
            <button onClick={() => {
              if (allCollapsed) { setCollapsed({}); setAllCollapsed(false); }
              else { const all = {}; sections.forEach(s => { all[s.name] = true; }); setCollapsed(all); setAllCollapsed(true); }
            }} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
              {allCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </button>
          </div>

          {/* Topic Sections — Collapsible, grouped by difficulty */}
          {sections.map((section, si) => {
            const isOpen = !collapsed[section.name];
            const diffGroups = ['EASY', 'MEDIUM', 'HARD']
              .map(d => ({ level: d, questions: section.questions.filter(q => q.difficulty === d) }))
              .filter(g => g.questions.length > 0);

            return (
              <div key={si} className="glass-card overflow-hidden mb-4">
                <button
                  onClick={() => { setCollapsed(prev => ({ ...prev, [section.name]: !prev[section.name] })); setAllCollapsed(false); }}
                  className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    <h3 className="text-sm font-semibold text-white">{section.name}</h3>
                    <div className="flex gap-1.5 ml-2">
                      {diffGroups.map(g => (
                        <span key={g.level} className={`text-[10px] px-1.5 py-0.5 rounded ${
                          g.level === 'EASY' ? 'bg-emerald-500/10 text-emerald-400' :
                          g.level === 'HARD' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>{g.questions.length}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">{section.solved}/{section.total}</span>
                </button>

                {isOpen && (
                  <div>
                    {diffGroups.map(({ level, questions }) => {
                      const diffKey = `${section.name}_${level}`;
                      const isDiffOpen = !collapsedDiff[diffKey];
                      const solvedInDiff = questions.filter(q => q.solved).length;
                      return (
                        <div key={level}>
                          <button
                            onClick={() => setCollapsedDiff(prev => ({ ...prev, [diffKey]: !prev[diffKey] }))}
                            className={`w-full px-5 py-2 flex items-center justify-between border-t border-slate-800/40 hover:bg-slate-800/20 transition-colors ${
                              level === 'EASY' ? 'bg-emerald-500/5' :
                              level === 'HARD' ? 'bg-red-500/5' : 'bg-amber-500/5'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isDiffOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                                level === 'EASY' ? 'text-emerald-400' : level === 'HARD' ? 'text-red-400' : 'text-amber-400'
                              }`}>
                                {level === 'EASY' ? 'Easy' : level === 'HARD' ? 'Hard' : 'Medium'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">{solvedInDiff}/{questions.length}</span>
                          </button>
                          {isDiffOpen && (
                            <div className="divide-y divide-slate-800/30">
                              {questions.map((q, qi) => (
                                <div key={qi} className="hover:bg-slate-800/20 transition-colors">
                                  {q.exists && q.id ? (
                                    <Link to={`/problem/${q.id}`} className="flex items-center gap-3 px-5 py-2.5">
                                      {q.solved ? (
                                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                                      ) : (
                                        <Circle className="w-4.5 h-4.5 text-slate-700 flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm text-slate-200">{q.title}</span>
                                        {showTags && q.tags?.length > 0 && (
                                          <div className="flex gap-1 mt-1 flex-wrap">
                                            {q.tags.map((tag, ti) => (
                                              <span key={ti} className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <span className={`text-xs font-medium flex-shrink-0 ${
                                        level === 'EASY' ? 'text-emerald-400' : level === 'HARD' ? 'text-red-400' : 'text-amber-400'
                                      }`}>
                                        {level === 'EASY' ? 'Easy' : level === 'HARD' ? 'Hard' : 'Medium'}
                                      </span>
                                    </Link>
                                  ) : (
                                    <div className="flex items-center gap-3 px-5 py-2.5 opacity-40">
                                      <Circle className="w-4.5 h-4.5 text-slate-700 flex-shrink-0" />
                                      <span className="text-sm text-slate-500 flex-1">{q.title}</span>
                                      <span className={`text-xs font-medium flex-shrink-0 ${
                                        level === 'EASY' ? 'text-emerald-400/50' : level === 'HARD' ? 'text-red-400/50' : 'text-amber-400/50'
                                      }`}>
                                        {level === 'EASY' ? 'Easy' : level === 'HARD' ? 'Hard' : 'Medium'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Set up study plan CTA */}
          <Link to="/studyplans" className="glass-card p-4 flex items-center gap-3 hover:border-indigo-500/30 transition-all">
            <span className="text-2xl">📋</span>
            <span className="text-sm text-white font-medium">Browse all study plans</span>
          </Link>

          {/* Weekly Ranking */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">📊 Progress Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total</span>
                <span className="text-white font-medium">{plan.solvedQuestions}/{plan.totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className={`font-medium ${plan.progress === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>{plan.progress}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Difficulty</span>
                <span className="text-slate-300">{plan.difficulty}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Est. Time</span>
                <span className="text-slate-300 flex items-center gap-1"><Clock className="w-3 h-3" /> ~{plan.estimatedHours}h</span>
              </div>
            </div>
          </div>

          {/* Section Progress */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">📂 By Topic</h3>
            <div className="space-y-2.5">
              {sections.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">{s.name}</span>
                    <span className="text-slate-500">{s.solved}/{s.total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${plan.color} rounded-full transition-all`}
                      style={{ width: `${s.total > 0 ? (s.solved / s.total) * 100 : 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
