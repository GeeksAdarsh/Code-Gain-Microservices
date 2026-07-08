import { Link } from 'react-router-dom';

/**
 * Shared brand logo — < ↑ > with "Code Gain Technology"
 * Used in both Navbar (top bar) and AdminLayout (sidebar).
 */
export default function BrandLogo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`flex items-center gap-2 shrink-0 group select-none ${className}`}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200 group-hover:scale-105 flex-shrink-0">
        <rect width="30" height="30" rx="7" fill="#ffa116"/>
        {/* Left angle bracket < */}
        <polyline points="10.5,8.5 6.5,15 10.5,21.5"
          stroke="white" strokeWidth="2.3" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
        {/* Right angle bracket > */}
        <polyline points="19.5,8.5 23.5,15 19.5,21.5"
          stroke="white" strokeWidth="2.3" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
        {/* Upward gain arrow ↑ */}
        <line x1="15" y1="20" x2="15" y2="10"
          stroke="white" strokeWidth="2.3" strokeLinecap="round"/>
        <polyline points="12,13 15,9.5 18,13"
          stroke="white" strokeWidth="2.3" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="flex items-baseline gap-0 leading-none">
        <span className="font-bold text-[14px] tracking-tight" style={{ color: 'inherit' }}>Code Gain</span>
        <span className="font-semibold text-[14px] tracking-tight ml-1" style={{ color: '#ffa116' }}>Technology</span>
      </div>
    </Link>
  );
}
