import type { NavIconKey } from '../../types';

export function NavIcon({ name }: { name: NavIconKey }) {
  const common = { viewBox: '0 0 16 16', fill: 'currentColor' as const };
  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common} fill="none">
          <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 14c0-3.3 2.2-5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="11" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10 9c2.8 0 5 1.7 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'cog':
      return (
        <svg {...common} fill="none">
          <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M7 1v1.5A5 5 0 002 7H1v2h1a5 5 0 005 4.5V15h2v-1.5A5 5 0 0014 9h1V7h-1a5 5 0 00-5-4.5V1H7z"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      );
    case 'flow':
      return (
        <svg {...common} fill="none">
          <rect x="1" y="1" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="11" y="6" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="1" y="11" width="4" height="4" rx="1" fill="currentColor" />
          <path d="M5 3h4a2 2 0 012 2v1M5 13h4a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'brain':
      return (
        <svg {...common} fill="none">
          <ellipse cx="8" cy="8" rx="5" ry="6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 2v12M3 8h10" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M2 12h2v2H2v-2zm3-4h2v6H5V8zm3-3h2v9H8V5zm3-2h2v11h-2V3z" />
        </svg>
      );
    case 'line':
      return (
        <svg {...common} fill="none">
          <polyline
            points="2,13 6,8 9,10 14,4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="4" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'layers':
      return (
        <svg {...common} fill="none">
          <path
            d="M8 1l7 4-7 4L1 5l7-4zm0 6l7 4-7 4L1 11l7-4z"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common} fill="none">
          <path
            d="M8 1l7 14H1L8 1zm0 5v4m0 2v1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'help':
      return (
        <svg {...common} fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M6 6.5a2 2 0 114 0c0 1-1 1.5-2 2.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="8" cy="12" r="0.7" fill="currentColor" />
        </svg>
      );
    case 'doc':
      return (
        <svg {...common} fill="none">
          <path d="M4 1h6l4 4v10H4V1zm6 0v4h4" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'credit':
      return (
        <svg {...common} fill="none">
          <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <line x1="1" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...common} fill="none">
          <path
            d="M2 2h5l7 7-5 5L2 7V2z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}
