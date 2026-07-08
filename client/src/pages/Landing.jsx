import { Link } from 'react-router-dom';
import { Code2, Users, Trophy, BookOpen, ArrowRight, Zap, Shield, Clock } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen animated-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300">Your College Coding Platform</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white">Code. Compete.</span>
              <br />
              <span className="gradient-text">Conquer.</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              The ultimate coding platform for your college. Practice problems, take tests,
              and level up your programming skills — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 group">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/compiler" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Try Compiler
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">5+</div>
                <div className="text-sm text-slate-400">Languages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100+</div>
                <div className="text-sm text-slate-400">Problems</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">∞</div>
                <div className="text-sm text-slate-400">Practice</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to <span className="gradient-text">Excel</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built specifically for college students and teachers with powerful features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Code2 className="w-8 h-8" />,
                title: 'Online Compiler',
                desc: 'Write, compile & run code in C, C++, Java, Python, JavaScript',
                color: 'from-indigo-500 to-blue-500',
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: 'Problem Bank',
                desc: 'Curated problems from Easy to Hard with test cases',
                color: 'from-cyan-500 to-teal-500',
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: 'Live Contests',
                desc: 'Timed coding tests with real-time leaderboards',
                color: 'from-amber-500 to-orange-500',
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: 'Role-Based Access',
                desc: 'Admin, Teacher & Student roles with unique permissions',
                color: 'from-pink-500 to-rose-500',
              },
            ].map((feature, i) => (
              <div key={i} className="glass-card p-6 hover:border-indigo-500/30 transition-all duration-300 group fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for <span className="gradient-text">Everyone</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Student */}
            <div className="glass-card p-8 text-center hover:border-emerald-500/30 transition-all">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Students</h3>
              <ul className="text-slate-400 text-sm space-y-2 text-left">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Practice coding problems</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Take assigned tests</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> View submissions & scores</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Use online compiler</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Track progress</li>
              </ul>
            </div>

            {/* Teacher */}
            <div className="glass-card p-8 text-center hover:border-blue-500/30 transition-all border-indigo-500/30">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-full text-xs text-white font-medium hidden md:block">
                Popular
              </div>
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Teachers</h3>
              <ul className="text-slate-400 text-sm space-y-2 text-left">
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Create coding questions</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Add test cases</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Launch timed tests</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> View student results</li>
                <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Manage question bank</li>
              </ul>
            </div>

            {/* Admin */}
            <div className="glass-card p-8 text-center hover:border-red-500/30 transition-all">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Admins</h3>
              <ul className="text-slate-400 text-sm space-y-2 text-left">
                <li className="flex items-center gap-2"><span className="text-red-400">✓</span> Manage all users</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✓</span> Assign roles</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✓</span> Platform analytics</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✓</span> Full system control</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✓</span> Enable/disable users</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="glass-card p-12 glow">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Coding?</h2>
            <p className="text-slate-400 mb-8">Join Code Gain Technology and take your coding skills to the next level.</p>
            <Link to="/register" className="btn-primary text-lg px-10 py-3 inline-flex items-center gap-2">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 Code Gain Technology — Built with ❤️ for College Coders</p>
        </div>
      </footer>
    </div>
  );
}
