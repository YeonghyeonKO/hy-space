// HySpace icons — minimal stroke icons.
// Sized via CSS (font-size or width/height); strokes are currentColor.

const Icon = ({ d, size = 18, fill = 'none', stroke = 'currentColor', strokeWidth = 1.6, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Seat:   (p) => <Icon {...p}><rect x="5" y="10" width="14" height="8" rx="1.5" /><path d="M7 10V6h10v4M7 18v2M17 18v2" /></Icon>,
  Room:   (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3 10h18M9 19V10M15 19V10" /></Icon>,
  List:   (p) => <Icon {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Icon>,
  Admin:  (p) => <Icon {...p}><path d="M12 3l8 4v5c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V7l8-4z" /></Icon>,
  Cal:    (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>,
  Clock:  (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Icon>,
  ChevD:  (p) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>,
  ChevR:  (p) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>,
  ChevL:  (p) => <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>,
  X:      (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>,
  Plus:   (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Lock:   (p) => <Icon {...p}><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></Icon>,
  Eye:    (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>,
  User:   (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></Icon>,
  Bell:   (p) => <Icon {...p}><path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16zM10 21h4" /></Icon>,
  Building: (p) => <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" /></Icon>,
  Floor:  (p) => <Icon {...p}><path d="M3 12l9-7 9 7M5 11v9h14v-9" /></Icon>,
  Pin:    (p) => <Icon {...p}><path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></Icon>,
  Check:  (p) => <Icon {...p}><path d="M5 12l5 5 9-10" /></Icon>,
  Filter: (p) => <Icon {...p}><path d="M4 5h16M7 12h10M10 19h4" /></Icon>,
  Grid:   (p) => <Icon {...p}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></Icon>,
  Tv:     (p) => <Icon {...p}><rect x="3" y="5" width="18" height="12" rx="1.5" /><path d="M8 21h8M12 17v4" /></Icon>,
  Cam:    (p) => <Icon {...p}><rect x="3" y="6" width="13" height="12" rx="1.5" /><path d="M16 10l5-3v10l-5-3" /></Icon>,
  Group:  (p) => <Icon {...p}><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 19c0-2 2-4 4-4s2 1 2 1" /></Icon>,
  Edit:   (p) => <Icon {...p}><path d="M14 4l6 6-11 11H3v-6L14 4z" /></Icon>,
  Trash:  (p) => <Icon {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Icon>,
  Move:   (p) => <Icon {...p}><path d="M12 3v18M3 12h18M8 7l-5 5 5 5M16 7l5 5-5 5M7 8l5-5 5 5M7 16l5 5 5-5" /></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></Icon>,
  Logo: (p) => (
    <svg width={p.size || 22} height={p.size || 22} viewBox="0 0 28 28" fill="none" {...p}>
      <rect width="28" height="28" rx="7" fill="currentColor" />
      {/* desk silhouette */}
      <g stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M5 11h18" />
        <path d="M5 11v1.5h18V11" fill="white" fillOpacity=".25" />
        <path d="M7 12.5v9" />
        <path d="M21 12.5v9" />
        <path d="M15 13v8.5h6V13" />
        <path d="M15 16.5h6" />
        <circle cx="19.2" cy="18.3" r=".55" fill="white" />
      </g>
    </svg>
  ),
};

window.I = I;
