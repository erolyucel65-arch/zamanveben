// Lucide icon path data (ISC) rendered through a tiny React wrapper.
const ICON_PATHS = {
  clock: ['<circle cx="12" cy="12" r="10"/>', '<polyline points="12 6 12 12 16 14"/>'],
  plus: ['<line x1="12" y1="5" x2="12" y2="19"/>', '<line x1="5" y1="12" x2="19" y2="12"/>'],
  check: ['<polyline points="20 6 9 17 4 12"/>'],
  list: ['<line x1="8" y1="6" x2="21" y2="6"/>', '<line x1="8" y1="12" x2="21" y2="12"/>', '<line x1="8" y1="18" x2="21" y2="18"/>', '<line x1="3" y1="6" x2="3.01" y2="6"/>', '<line x1="3" y1="12" x2="3.01" y2="12"/>', '<line x1="3" y1="18" x2="3.01" y2="18"/>'],
  calendar: ['<rect x="3" y="4" width="18" height="18" rx="2"/>', '<line x1="16" y1="2" x2="16" y2="6"/>', '<line x1="8" y1="2" x2="8" y2="6"/>', '<line x1="3" y1="10" x2="21" y2="10"/>'],
  settings: ['<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>', '<circle cx="12" cy="12" r="3"/>'],
  flame: ['<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'],
  trophy: ['<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>', '<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>', '<path d="M4 22h16"/>', '<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>', '<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>', '<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>'],
  trending: ['<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>', '<polyline points="16 7 22 7 22 13"/>'],
  sun: ['<circle cx="12" cy="12" r="4"/>', '<path d="M12 2v2"/>', '<path d="M12 20v2"/>', '<path d="m4.93 4.93 1.41 1.41"/>', '<path d="m17.66 17.66 1.41 1.41"/>', '<path d="M2 12h2"/>', '<path d="M20 12h2"/>', '<path d="m6.34 17.66-1.41 1.41"/>', '<path d="m19.07 4.93-1.41 1.41"/>'],
  moon: ['<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'],
  monitor: ['<rect x="2" y="3" width="20" height="14" rx="2"/>', '<line x1="8" y1="21" x2="16" y2="21"/>', '<line x1="12" y1="17" x2="12" y2="21"/>'],
  bell: ['<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>', '<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'],
  download: ['<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>', '<polyline points="7 10 12 15 17 10"/>', '<line x1="12" y1="15" x2="12" y2="3"/>'],
  upload: ['<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>', '<polyline points="17 8 12 3 7 8"/>', '<line x1="12" y1="3" x2="12" y2="15"/>'],
  trash: ['<polyline points="3 6 5 6 21 6"/>', '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', '<line x1="10" y1="11" x2="10" y2="17"/>', '<line x1="14" y1="11" x2="14" y2="17"/>'],
  chevron: ['<polyline points="9 18 15 12 9 6"/>'],
  login: ['<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>', '<polyline points="10 17 15 12 10 7"/>', '<line x1="21" y1="12" x2="3" y2="12"/>'],
  x: ['<line x1="18" y1="6" x2="6" y2="18"/>', '<line x1="6" y1="6" x2="18" y2="18"/>'],
  sparkle: ['<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/>'],
  layers: ['<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>', '<path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>', '<path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'],
  pencil: ['<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>', '<path d="m15 5 4 4"/>'],
  globe: ['<circle cx="12" cy="12" r="10"/>', '<line x1="2" y1="12" x2="22" y2="12"/>', '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'],
  grid: ['<rect x="3" y="3" width="7" height="7" rx="1.4"/>', '<rect x="14" y="3" width="7" height="7" rx="1.4"/>', '<rect x="3" y="14" width="7" height="7" rx="1.4"/>', '<rect x="14" y="14" width="7" height="7" rx="1.4"/>'],
  subtask: ['<polyline points="9 10 4 15 9 20"/>', '<path d="M20 4v7a4 4 0 0 1-4 4H4"/>'],
  grip: ['<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/>', '<circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/>', '<circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/>', '<circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/>', '<circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/>', '<circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>'],
  star: ['<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'],
  repeat: ['<path d="m17 2 4 4-4 4"/>', '<path d="M3 11v-1a4 4 0 0 1 4-4h14"/>', '<path d="m7 22-4-4 4-4"/>', '<path d="M21 13v1a4 4 0 0 1-4 4H3"/>'],
  note: ['<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/>', '<polyline points="15 2 15 7 20 7"/>', '<line x1="8" y1="13" x2="16" y2="13"/>', '<line x1="8" y1="17" x2="13" y2="17"/>'],
  search: ['<circle cx="11" cy="11" r="8"/>', '<line x1="21" y1="21" x2="16.65" y2="16.65"/>'],
  alarm: ['<circle cx="12" cy="13" r="8"/>', '<path d="M12 9v4l2 2"/>', '<path d="M5 3 2 6"/>', '<path d="m22 6-3-3"/>', '<path d="M6.38 18.7 4 21"/>', '<path d="M17.64 18.67 20 21"/>'],
  sunrise: ['<path d="M12 2v8"/>', '<path d="m4.93 10.93 1.41 1.41"/>', '<path d="M2 18h2"/>', '<path d="M20 18h2"/>', '<path d="m19.07 10.93-1.41 1.41"/>', '<path d="M22 22H2"/>', '<path d="m8 6 4-4 4 4"/>', '<path d="M16 18a4 4 0 0 0-8 0"/>'],
  circle: ['<circle cx="12" cy="12" r="9"/>'],
};

function Icon({ name, size = 20, stroke = 2, className = '', style }) {
  const inner = ICON_PATHS[name] || [];
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner.join('') }}
    />
  );
}

window.Icon = Icon;
