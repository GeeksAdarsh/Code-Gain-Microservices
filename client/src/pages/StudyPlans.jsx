import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function StudyPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get('/studyplans');
      setPlans(res.data);
    } catch (err) {
      toast.error('Failed to load study plans');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="gradient-text">Study Plans</span>
        </h1>
        <p className="text-slate-400">Curated problem lists to ace your coding interviews</p>
      </div>

      {/* Featured Plans — Striver + Blind 75 + Top Interview 150 */}
      {(() => {
        const striver = plans.find(p => p.id === 'striver-a2z');
        const others = plans.filter(p => p.id !== 'striver-a2z').slice(0, 2);
        const featured = [striver, ...others].filter(Boolean);
        return (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {featured.map(plan => (
              <Link key={plan.id} to={`/studyplan/${plan.id}`}
                className="glass-card p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${plan.color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`}></div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-3xl mb-2 block">{plan.icon}</span>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    </div>
                    {plan.progress > 0 && (
                      <span className={`text-2xl font-bold ${plan.progress === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {plan.progress}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{plan.description}</p>

                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div className={`h-full bg-gradient-to-r ${plan.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${plan.progress || 0}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{plan.solvedQuestions}/{plan.totalQuestions} problems</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{plan.estimatedHours}h</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}

      {/* All Plans Grid */}
      <h2 className="text-lg font-semibold text-white mb-4">All Study Plans</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Link key={plan.id} to={`/studyplan/${plan.id}`}
            className="glass-card p-5 hover:border-indigo-500/20 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{plan.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{plan.name}</h3>
                <span className="text-xs text-slate-500">{plan.difficulty}</span>
              </div>
              {plan.progress === 100 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              )}
            </div>

            {/* Mini progress */}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div className={`h-full bg-gradient-to-r ${plan.color} rounded-full transition-all`}
                style={{ width: `${plan.progress || 0}%` }}></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{plan.solvedQuestions}/{plan.totalQuestions} done</span>
              <span>~{plan.estimatedHours}h</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
