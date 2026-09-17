const START_HOUR = 8, END_HOUR = 22, HOUR_H = 80;
const DURATIONS = [15, 30, 45, 60, 90];

function fmtTime(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── My Day: a daily, self-clearing focus list (stamped with today's date) ──
function MyDaySection({ store, t, onOpen }) {
  const { state, toggleComplete, toggleMyDay } = store;
  const td = today();
  const doneToday = id => !!state.completions[id]?.[td];
  const mine = state.items.filter(i => i.myDay === td);
  const doneN = mine.filter(i => doneToday(i.id)).length;
  const suggestions = state.items
    .filter(i => i.myDay !== td && !i.parentId && !(i.type === 'task' && isDone(state, i.id))
      && (i.horizon === 'today' || i.due === td || i.flag))
    .slice(0, 8);

  return (
    <Card className="p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span style={{ color: 'var(--accent)' }}><Icon name="sunrise" size={22} /></span>
          <div>
            <h2 className="font-extrabold text-[20px] leading-none">{t('myday_title')}</h2>
            <p className="text-faint text-[13px] font-medium mt-1">{mine.length ? t('myday_done', doneN, mine.length) : t('myday_sub')}</p>
          </div>
        </div>
        {mine.length > 0 && <Gauge done={doneN} total={mine.length} size={54} label={t('myday_title')} />}
      </div>

      {mine.length > 0 ? (
        <div className="flex flex-col gap-1.5 mb-1">
          {mine.map(it => {
            const done = doneToday(it.id);
            return (
              <div key={it.id} onClick={() => onOpen(it.id)} className="group flex items-center gap-3 rounded-2xl p-2.5 pr-3 cursor-pointer transition-colors hover:bg-cream/50">
                <button
                  onClick={e => { e.stopPropagation(); const was = done; toggleComplete(it.id, td); if (!was) toast(`${it.name} · ${t('toast_completed')}`, t('undo'), () => toggleComplete(it.id, td)); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all active:scale-90"
                  style={{ borderColor: done ? 'var(--done-edge)' : it.color, background: done ? 'var(--done-edge)' : 'transparent' }}
                  aria-label={t('mark_complete')}
                >
                  {done && <Icon name="check" size={15} stroke={3} className="text-white pop" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`font-bold text-[15px] leading-tight truncate ${done ? 'line-through text-faint' : 'text-ink'}`}>{it.name}</p>
                  {(it.remind || it.due) && (
                    <div className="flex items-center gap-3 mt-0.5 text-faint text-[12px] font-semibold">
                      {it.remind && <span className="inline-flex items-center gap-1 tnum"><Icon name="alarm" size={12} />{it.remind}</span>}
                      {it.flag && <Icon name="star" size={12} style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />}
                    </div>
                  )}
                </div>
                <button onClick={e => { e.stopPropagation(); toggleMyDay(it.id); }} className="p-1.5 shrink-0 text-faint hover:text-danger transition-colors opacity-0 group-hover:opacity-100" title={t('remove_myday')} aria-label={t('remove_myday')}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-faint text-[14px] font-medium py-2">{t('myday_empty')}</p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line">
          <p className="text-faint text-[11px] font-bold tracking-[0.1em] mb-2.5">{t('suggestions').toUpperCase()}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(it => (
              <button key={it.id} onClick={() => toggleMyDay(it.id)} className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-[13.5px] font-semibold text-ink bg-cream border border-line hover:border-espresso/30 transition-colors">
                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: it.color }}><Icon name="plus" size={11} stroke={3} className="text-white" /></span>
                {it.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function TodayView({ store, onOpen, timelinePos = 'bottom' }) {
  const { state, toggleComplete, addBlock, moveBlock, removeBlock } = store;
  const t = makeT(state.lang);
  const [tab, setTab] = useStateC('habit');           // habit | task
  const [duration, setDuration] = useStateC(30);
  const [selId, setSelId] = useStateC(null);
  const [range, setRange] = useStateC('today');
  const trackRef = useRefC(null);
  const drag = useRefC(null);
  const pd = useRefC(null);
  const [ghost, setGhost] = useStateC(null);
  const td = today();

  const blocksToday = state.blocks.filter(b => b.date === td);
  const scheduled = id => blocksToday.some(b => b.itemId === id);

  const scoped = state.items.filter(i => i.horizon === range);
  const habitItems = scoped.filter(i => i.type === 'habit');
  const planned = id => range === 'today' ? scheduled(id) : state.assignments.some(a => a.itemId === id);
  const plannable = scoped.filter(i => i.type === tab && !planned(i.id));
  const doneCount = habitItems.filter(i => state.completions[i.id]?.[td]).length;
  const itemById = id => state.items.find(i => i.id === id);
  const RANGES = [
    { v: 'today', label: t('r_daily') }, { v: 'week', label: t('r_weekly') },
    { v: 'month', label: t('r_monthly') }, { v: 'year', label: t('r_yearly') },
  ];

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowOffset = ((nowMin - START_HOUR * 60) / 60) * HOUR_H;
  const nowVisible = nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;

  const greeting = now.getHours() < 12 ? t('greet_morning') : now.getHours() < 18 ? t('greet_afternoon') : t('greet_evening');
  const dateLabel = now.toLocaleDateString(localeOf(state.lang), { weekday: 'long', month: 'long', day: 'numeric' });

  // Öğenin detay panelinde seçilmiş süresi varsa o kazanır, yoksa çizelge süresi
  function durFor(id) {
    const it = state.items.find(i => i.id === id);
    return (it && it.estimate) || duration;
  }

  function yToMin(clientY, dur) {
    const rect = trackRef.current.getBoundingClientRect();
    let min = START_HOUR * 60 + ((clientY - rect.top) / HOUR_H) * 60;
    min = Math.round(min / 15) * 15;
    return Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - (dur || duration), min));
  }

  function placeAt(clientY) {
    if (!selId) return;
    const dur = durFor(selId);
    addBlock(selId, yToMin(clientY, dur), dur, td);
  }

  // drag a pill from the planner onto the timeline (mouse + touch)
  function onPillDown(e, it) {
    const sx = e.clientX, sy = e.clientY;
    pd.current = { it, dragging: false };
    const calc = (cx, cy) => {
      const rect = trackRef.current.getBoundingClientRect();
      const over = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
      let min = START_HOUR * 60 + ((cy - rect.top) / HOUR_H) * 60;
      min = Math.round(min / 15) * 15;
      min = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - durFor(it.id), min));
      return { over, min };
    };
    const move = ev => {
      const cx = ev.clientX, cy = ev.clientY;
      if (!pd.current.dragging && Math.hypot(cx - sx, cy - sy) < 6) return;
      pd.current.dragging = true;
      const { over, min } = calc(cx, cy);
      setGhost({ id: it.id, name: it.name, color: it.color, x: cx, y: cy, over, min });
    };
    const up = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (pd.current && pd.current.dragging) {
        const { over, min } = calc(ev.clientX, ev.clientY);
        if (over) addBlock(it.id, min, durFor(it.id), td);
      } else {
        setSelId(s => (s === it.id ? null : it.id));
      }
      setGhost(null);
      pd.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  // dragging a placed block
  function onBlockDown(e, b) {
    e.stopPropagation();
    drag.current = { id: b.id, moved: false };
    const move = ev => {
      drag.current.moved = true;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const rect = trackRef.current.getBoundingClientRect();
      let min = START_HOUR * 60 + ((cy - rect.top) / HOUR_H) * 60 - b.duration / 2;
      min = Math.round(min / 15) * 15;
      min = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - b.duration, min));
      moveBlock(b.id, min);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setTimeout(() => { drag.current = null; }, 0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  const sideLayout = range === 'today' && (timelinePos === 'right' || timelinePos === 'left');
  const gridCls = sideLayout ? 'md:grid md:grid-cols-2 md:gap-6 md:items-start' : '';
  const planColCls = sideLayout && timelinePos === 'left' ? 'md:order-2' : '';
  const plannerColCls = sideLayout && timelinePos === 'left' ? 'md:order-1' : '';

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-muted font-medium text-[15px]">{greeting}</p>
          <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-[1.05] mt-1">{t('daily_ritual')}</h1>
          <p className="text-faint font-medium mt-2 tnum">{dateLabel} · {t('done_summary', doneCount, habitItems.length)}</p>
        </div>
        <Gauge done={doneCount} total={habitItems.length} size={92} label={t('gauge_today')} />
      </div>

      <MyDaySection store={store} t={t} onOpen={onOpen} />

      <div className="flex items-center gap-1.5 flex-wrap mb-6">
        {RANGES.map(r => (
          <Chip key={r.v} active={range === r.v} dark onClick={() => setRange(r.v)}>{r.label}</Chip>
        ))}
      </div>

      {/* Günü Planla */}
      <div className={gridCls}>
      <div className={planColCls}>
      <Card className={`p-5 sm:p-6 mb-6 ${sideLayout ? 'md:mb-0' : ''}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 font-bold">
            <Icon name="clock" size={18} className="text-espresso" />
            {range === 'today' ? t('plan_day') : range === 'week' ? t('plan_week') : range === 'month' ? t('plan_month') : t('plan_year')}
          </div>
          <p className="text-faint text-[13px] font-medium hidden sm:block">{range === 'today' ? t('plan_hint') : t('pick_then_tap')}</p>
        </div>
        <div className="mb-4">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[{ value: 'habit', label: t('type_habits') }, { value: 'task', label: t('type_tasks') }]}
          />
        </div>
        <div className="flex flex-wrap gap-2.5 mb-5">
          {plannable.map(it => {
            const active = selId === it.id;
            const isTimeline = range === 'today';
            return (
              <button
                key={it.id}
                onPointerDown={isTimeline ? (e => onPillDown(e, it)) : undefined}
                onClick={isTimeline ? undefined : () => setSelId(s => (s === it.id ? null : it.id))}
                className={`flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full text-[14px] font-semibold border transition-all duration-150 select-none ${isTimeline ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                  ${active ? 'text-cream border-transparent' : 'text-ink bg-card border-line hover:border-espresso/30'}`}
                style={{ touchAction: 'none', ...(active ? { background: 'var(--espresso)' } : {}) }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: it.color }} />
                {it.name}
              </button>
            );
          })}
          {plannable.length === 0 && <p className="text-faint text-sm py-1">{tab === 'habit' ? t('no_habits_today') : t('no_tasks_today')} {t('tag_from_library')}</p>}
        </div>
        {range === 'today' && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-faint text-[13px] font-semibold mr-1.5">{t('duration')}</span>
          {DURATIONS.map(d => (
            <Chip key={d} active={duration === d} dark onClick={() => setDuration(d)}>{d}{t('min_suffix')}</Chip>
          ))}
        </div>
        )}
      </Card>
      </div>
      <div className={plannerColCls}>

      {/* Planner surface — depends on range */}
      {range === 'today' ? (
      <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2.5 font-bold border-b border-line">
            <Icon name="calendar" size={16} className="text-espresso" />
            {t('timeline')}
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            <div
              ref={trackRef}
              onClick={e => placeAt(e.clientY)}
              className="relative mx-4 my-2"
              style={{ height: (END_HOUR - START_HOUR) * HOUR_H, cursor: selId ? 'copy' : 'default' }}
            >
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                <div key={i} className="absolute left-0 right-0 flex items-center" style={{ top: i * HOUR_H }}>
                  <span className="tnum text-[11px] font-semibold text-faint w-10 shrink-0 -mt-px">{String(START_HOUR + i).padStart(2, '0')}:00</span>
                  <span className="flex-1 h-px" style={{ background: 'var(--line)' }} />
                </div>
              ))}

              {nowVisible && (
                <div className="absolute left-10 right-0 z-20 pointer-events-none flex items-center" style={{ top: nowOffset }}>
                  <span className="w-2 h-2 rounded-full -ml-1" style={{ background: 'var(--accent)' }} />
                  <span className="flex-1 h-[2px]" style={{ background: 'var(--accent)' }} />
                </div>
              )}

              {ghost && ghost.over && (
                <div
                  className="absolute left-10 right-0 rounded-2xl z-30 pointer-events-none border-2 border-dashed flex items-center px-3"
                  style={{
                    top: ((ghost.min - START_HOUR * 60) / 60) * HOUR_H + 2,
                    height: Math.max((durFor(ghost.id || selId) / 60) * HOUR_H - 4, 24),
                    borderColor: 'var(--espresso)',
                    background: `color-mix(in srgb, ${ghost.color} 16%, var(--card))`,
                  }}
                >
                  <span className="tnum text-[12px] font-bold text-espresso">{fmtTime(ghost.min)}–{fmtTime(ghost.min + durFor(ghost.id || selId))}</span>
                </div>
              )}

              {blocksToday.map(b => {
                const it = itemById(b.itemId);
                if (!it) return null;
                const done = !!state.completions[b.itemId]?.[td];
                return (
                  <div
                    key={b.id}
                    onPointerDown={e => onBlockDown(e, b)}
                    onClick={e => e.stopPropagation()}
                    className="absolute left-10 right-0 rounded-2xl pl-3 pr-2 z-10 cursor-grab active:cursor-grabbing overflow-hidden flex items-center gap-2"
                    style={{
                      top: ((b.startMin - START_HOUR * 60) / 60) * HOUR_H + 2,
                      height: Math.max((b.duration / 60) * HOUR_H - 4, 24),
                      background: done ? 'var(--done-bg)' : `color-mix(in srgb, ${it.color} 20%, var(--card))`,
                      border: `1.5px solid ${done ? 'var(--done-edge)' : it.color}`,
                    }}
                    title={t('drag_move')}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: done ? 'var(--done-edge)' : it.color }} />
                    <p className="font-bold text-[13px] leading-tight truncate text-ink flex-1 min-w-0">{it.name}</p>
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); toggleComplete(b.itemId, td); }}
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all active:scale-90"
                      style={{ borderColor: done ? 'var(--done-edge)' : 'var(--faint)', background: done ? 'var(--done-edge)' : 'transparent' }}
                      title={done ? t('done_undo') : t('mark_done')}
                      aria-label={t('done')}
                    >
                      {done && <Icon name="check" size={14} stroke={3} className="text-white" />}
                    </button>
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); removeBlock(b.id); }}
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-faint hover:text-danger transition-colors"
                      title={t('delete')}
                      aria-label={t('delete')}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {selId && (
            <div className="px-5 py-3 border-t border-line text-[13px] font-medium text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: itemById(selId)?.color }} />
              {t('selected_tap', itemById(selId)?.name, durFor(selId))}
            </div>
          )}
        </Card>
        ) : range === 'week' ? (
          <WeekPlanner store={store} selId={selId} t={t} lang={state.lang} />
        ) : range === 'month' ? (
          <MonthPlanner store={store} selId={selId} t={t} lang={state.lang} />
        ) : (
          <YearPlanner store={store} selId={selId} t={t} lang={state.lang} />
        )}
        </div>
        </div>
        {ghost && (
          <div
            className="fixed z-[60] pointer-events-none px-3.5 py-2 rounded-full text-cream text-[14px] font-bold shadow-lift flex items-center gap-2"
            style={{ left: ghost.x, top: ghost.y, transform: 'translate(-50%,-50%)', background: 'var(--espresso)' }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: ghost.color }} />
            {ghost.name}
          </div>
        )}
    </div>
  );
}

window.TodayView = TodayView;
