const { useState: useStateP } = React;

// ── date helpers (use global dateStr/addDays from store) ─────────
function weekDatesMon(d) {
  const day = (d.getDay() + 6) % 7;
  const mon = addDays(d, -day);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}
function monthWeeks(year, month) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const start = addDays(first, -lead);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const week = [];
    let anyIn = false;
    for (let i = 0; i < 7; i++) {
      const dt = addDays(start, w * 7 + i);
      const inM = dt.getMonth() === month;
      if (inM) anyIn = true;
      week.push({ ds: dateStr(dt), inM, day: dt.getDate() });
    }
    if (w >= 4 && !anyIn) break;
    weeks.push(week);
  }
  return weeks;
}

// small assigned-item chip
function PChip({ it, onRemove }) {
  if (!it) return null;
  return (
    <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[12px] font-semibold max-w-full" style={{ background: `color-mix(in srgb, ${it.color} 18%, var(--card))`, border: `1px solid ${it.color}` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.color }} />
      <span className="truncate">{it.name}</span>
      <button onClick={e => { e.stopPropagation(); onRemove(); }} className="shrink-0 text-faint hover:text-danger p-0.5" aria-label="x">
        <Icon name="x" size={12} stroke={2.6} />
      </button>
    </span>
  );
}

// read-only chip for a task that lands here via its due date
function DueChip({ it }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] font-semibold max-w-full" style={{ border: `1px dashed ${it.color}`, color: 'var(--muted)' }} title={it.name}>
      <Icon name="calendar" size={11} />
      <span className="truncate">{it.name}</span>
    </span>
  );
}

function DueLegend({ t }) {
  return (
    <div className="px-5 py-2.5 border-t border-line flex items-center gap-2 text-faint text-[12px] font-medium">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ border: '1px dashed var(--faint)' }}><Icon name="calendar" size={10} /></span>
      {t('auto_due_hint')}
    </div>
  );
}

function NavHeader({ title, onPrev, onNext, hint }) {
  return (
    <div className="px-5 pt-5 pb-3 border-b border-line">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onPrev} className="p-1.5 text-muted hover:text-ink rounded-full" aria-label="prev" style={{ transform: 'rotate(180deg)' }}><Icon name="chevron" size={20} /></button>
        <h3 className="font-bold text-[16px] capitalize text-center flex-1">{title}</h3>
        <button onClick={onNext} className="p-1.5 text-muted hover:text-ink rounded-full" aria-label="next"><Icon name="chevron" size={20} /></button>
      </div>
      {hint && <p className="text-faint text-[12px] font-medium text-center mt-1">{hint}</p>}
    </div>
  );
}

function WeekPlanner({ store, selId, t, lang }) {
  const { state, addAssignment, removeAssignment } = store;
  const [off, setOff] = useStateP(0);
  const days = weekDatesMon(addDays(new Date(), off * 7));
  const itemById = id => state.items.find(i => i.id === id);
  const byKey = ds => state.assignments.filter(a => a.key === ds);
  const dueOn = ds => state.items.filter(i => i.due === ds && i.type === 'task');
  const td = today();
  const title = `${days[0].toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'short' })}`;

  return (
    <Card className="p-0 overflow-hidden">
      <NavHeader title={title} onPrev={() => setOff(off - 1)} onNext={() => setOff(off + 1)} hint={t('pick_then_tap')} />
      <div className="flex flex-col">
        {days.map(d => {
          const ds = dateStr(d);
          const list = byKey(ds);
          const dues = dueOn(ds);
          const isToday = ds === td;
          return (
            <button key={ds} onClick={() => selId && addAssignment(selId, ds)} className="text-left px-5 py-3 border-b border-line last:border-0 flex gap-4 items-start hover:bg-cream/40 transition-colors" style={{ cursor: selId ? 'copy' : 'default' }}>
              <div className="w-14 shrink-0 pt-1">
                <p className="font-bold text-[13px] capitalize" style={{ color: isToday ? 'var(--accent)' : 'var(--ink)' }}>{d.toLocaleDateString(localeOf(lang), { weekday: 'short' })}</p>
                <p className="tnum text-[12px] text-faint font-semibold">{d.toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 min-h-[28px] items-center">
                {list.map(a => <PChip key={a.id} it={itemById(a.itemId)} onRemove={() => removeAssignment(a.id)} />)}
                {dues.map(i => <DueChip key={'d' + i.id} it={i} />)}
                {list.length === 0 && dues.length === 0 && <span className="text-faint text-[13px]">{selId ? '＋' : ''}</span>}
              </div>
            </button>
          );
        })}
      </div>
      <DueLegend t={t} />
    </Card>
  );
}

function MonthPlanner({ store, selId, t, lang }) {
  const { state, addAssignment, removeAssignment } = store;
  const [off, setOff] = useStateP(0);
  const base = new Date();
  base.setDate(1); base.setMonth(base.getMonth() + off);
  const year = base.getFullYear(), month = base.getMonth();
  const weeks = monthWeeks(year, month);
  const itemById = id => state.items.find(i => i.id === id);
  const byKey = ds => state.assignments.filter(a => a.key === ds);
  const dueOn = ds => state.items.filter(i => i.due === ds && i.type === 'task');
  const td = today();
  const wd = weekDatesMon(new Date(2024, 0, 1)); // Mon..Sun sample for headers

  return (
    <Card className="p-0 overflow-hidden">
      <NavHeader title={base.toLocaleDateString(localeOf(lang), { month: 'long', year: 'numeric' })} onPrev={() => setOff(off - 1)} onNext={() => setOff(off + 1)} hint={t('pick_then_tap')} />
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {wd.map((d, i) => <span key={i} className="text-center text-faint text-[11px] font-bold capitalize">{d.toLocaleDateString(localeOf(lang), { weekday: 'short' }).slice(0, 2)}</span>)}
        </div>
        <div className="flex flex-col gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5 items-stretch">
              {week.map(cell => {
                const list = byKey(cell.ds);
                const dues = dueOn(cell.ds);
                const isToday = cell.ds === td;
                const room = Math.max(0, 3 - list.length);
                return (
                  <button key={cell.ds} onClick={() => selId && addAssignment(selId, cell.ds)} className="rounded-xl p-1.5 min-h-[58px] text-left flex flex-col gap-1 transition-colors hover:bg-cream/50" style={{ background: cell.inM ? 'var(--bg)' : 'transparent', opacity: cell.inM ? 1 : 0.4, outline: isToday ? '2px solid var(--accent)' : 'none', cursor: selId ? 'copy' : 'default' }}>
                    <span className="tnum text-[11px] font-bold text-muted">{cell.day}</span>
                    <div className="flex flex-col gap-0.5">
                      {list.slice(0, 3).map(a => {
                        const it = itemById(a.itemId);
                        return it ? (
                          <span key={a.id} onClick={e => { e.stopPropagation(); removeAssignment(a.id); }} className="flex items-center gap-1 rounded-md px-1 py-0.5 text-[9px] font-bold leading-tight" style={{ background: `color-mix(in srgb, ${it.color} 22%, var(--card))` }} title={it.name}>
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: it.color }} />
                            <span className="truncate">{it.name}</span>
                          </span>
                        ) : null;
                      })}
                      {dues.slice(0, room).map(i => (
                        <span key={'d' + i.id} className="flex items-center gap-1 rounded-md px-1 py-0.5 text-[9px] font-bold leading-tight" style={{ border: `1px dashed ${i.color}`, color: 'var(--muted)' }} title={i.name}>
                          <span className="truncate">{i.name}</span>
                        </span>
                      ))}
                      {(list.length + dues.length) > 3 && <span className="text-[9px] font-bold text-faint">+{list.length + dues.length - 3}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <DueLegend t={t} />
    </Card>
  );
}

function YearPlanner({ store, selId, t, lang }) {
  const { state, addAssignment, removeAssignment } = store;
  const [off, setOff] = useStateP(0);
  const year = new Date().getFullYear() + off;
  const itemById = id => state.items.find(i => i.id === id);
  const byKey = k => state.assignments.filter(a => a.key === k);
  const curMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  return (
    <Card className="p-0 overflow-hidden">
      <NavHeader title={String(year)} onPrev={() => setOff(off - 1)} onNext={() => setOff(off + 1)} hint={t('pick_then_tap')} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 sm:p-4">
        {Array.from({ length: 12 }, (_, m) => {
          const key = `${year}-${String(m + 1).padStart(2, '0')}`;
          const list = byKey(key);
          const isCur = key === curMonthKey;
          const name = new Date(year, m, 1).toLocaleDateString(localeOf(lang), { month: 'long' });
          return (
            <button key={key} onClick={() => selId && addAssignment(selId, key)} className="rounded-2xl p-3 min-h-[96px] text-left flex flex-col gap-2 transition-colors hover:bg-cream/50" style={{ background: 'var(--bg)', outline: isCur ? '2px solid var(--accent)' : 'none', cursor: selId ? 'copy' : 'default' }}>
              <p className="font-bold text-[14px] capitalize">{name}</p>
              <div className="flex flex-wrap gap-1">
                {list.map(a => <PChip key={a.id} it={itemById(a.itemId)} onRemove={() => removeAssignment(a.id)} />)}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

Object.assign(window, { WeekPlanner, MonthPlanner, YearPlanner });
