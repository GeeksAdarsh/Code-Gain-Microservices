import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold text-[#ffa116]/30 mb-2">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-slate-400 mb-8">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn-secondary py-2.5 px-6 text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/" className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2">
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
