const { useState: useStateC, useRef: useRefC } = React;

// Segmented two/three-way toggle (Alışkanlıklar / Görevler, Light/Dark/Auto …)
function Segmented({ options, value, onChange, size = 'lg' }) {
  const pad = size === 'lg' ? 'py-3 text-[15px]' : 'py-2 text-[13px]';
  return (
    <div className="relative flex bg-cream rounded-full p-1">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 ${pad} rounded-full font-semibold transition-colors duration-200
              ${active ? (opt.dark ? 'text-cream' : 'text-ink') : 'text-faint hover:text-muted'}`}
            style={active && opt.dark ? { background: 'var(--espresso)' } : active ? { background: 'var(--card)', boxShadow: '0 1px 2px rgba(74,53,37,.06), 0 6px 16px -10px rgba(74,53,37,.3)' } : undefined}
          >
            {opt.icon && <Icon name={opt.icon} size={16} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Small rounded chip (duration picker, veri seti)
function Chip({ children, active, onClick, dark }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150
        ${active ? (dark ? 'text-cream' : 'text-ink bg-cream') : 'text-faint hover:text-muted'}`}
      style={active && dark ? { background: 'var(--espresso)' } : undefined}
    >
      {children}
    </button>
  );
}

// Toggle switch
function Switch({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative w-[52px] h-[30px] rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? 'var(--espresso)' : 'var(--line)' }}
      aria-pressed={on}
    >
      <span
        className="absolute top-[3px] left-[3px] w-6 h-6 rounded-full bg-white transition-transform duration-200"
        style={{ transform: on ? 'translateX(22px)' : 'none', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }}
      />
    </button>
  );
}

// Circular completion gauge
function Gauge({ done, total, size = 84, label = 'TODAY' }) {
  const r = (size - 12) / 2, c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,.61,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-extrabold text-ink leading-none" style={{ fontSize: size * 0.26 }}>{done}/{total}</span>
        <span className="text-[9px] font-bold tracking-[0.12em] text-faint mt-0.5">{label}</span>
      </div>
    </div>
  );
}

// Status circle on list rows
function StatusCircle({ done, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 border-2"
      style={{
        borderColor: done ? color : 'var(--line)',
        background: done ? color : 'transparent',
      }}
      aria-pressed={done}
    >
      {done && <Icon name="check" size={22} stroke={3} className="text-white pop" />}
    </button>
  );
}

function Card({ children, className = '', ...rest }) {
  return (
    <div className={`bg-card rounded-4xl shadow-soft ${className}`} {...rest}>{children}</div>
  );
}

// ── Undo toast ──────────────────────────────────────────────────
function Toaster() {
  const [msg, setMsg] = useStateC(null);
  const timer = useRefC(null);
  React.useEffect(() => {
    window.__ritualToast = (m) => {
      setMsg(m);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg(null), 5000);
    };
    return () => { window.__ritualToast = null; clearTimeout(timer.current); };
  }, []);
  if (!msg) return null;
  return (
    <div
      className="fixed left-1/2 z-[80] flex items-center gap-4 pl-5 pr-3 py-3 rounded-full shadow-lift settle"
      style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))', transform: 'translateX(-50%)', background: 'var(--ink)', color: 'var(--bg)', maxWidth: 'calc(100vw - 2rem)' }}
      role="status"
    >
      <span className="text-[14px] font-semibold truncate">{msg.text}</span>
      {msg.actionLabel && (
        <button
          onClick={() => { if (msg.onAction) msg.onAction(); setMsg(null); }}
          className="text-[14px] font-extrabold px-2.5 py-1 rounded-full shrink-0 transition-transform active:scale-95"
          style={{ color: 'var(--accent)' }}
        >
          {msg.actionLabel}
        </button>
      )}
    </div>
  );
}
function toast(text, actionLabel, onAction) {
  if (window.__ritualToast) window.__ritualToast({ text, actionLabel, onAction });
}

Object.assign(window, { Segmented, Chip, Switch, Gauge, StatusCircle, Card, Toaster, toast });
