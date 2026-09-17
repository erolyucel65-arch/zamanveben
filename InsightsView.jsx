const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function MetricCell({ value, label }) {
  return (
    <div className="flex-1 text-center">
      <p className="tnum text-[30px] sm:text-[34px] font-extrabold text-ink leading-none">{value}</p>
      <p className="text-faint text-[13px] font-semibold mt-1.5">{label}</p>
    </div>
  );
}

function StatTile({ icon, value, label }) {
  return (
    <div className="flex-1 bg-cream rounded-2xl px-3 py-3">
      <Icon name={icon} size={16} className="text-muted mb-1.5" />
      <p className="tnum text-[22px] font-extrabold text-ink leading-none">{value}</p>
      <p className="text-faint text-[12px] font-semibold mt-1">{label}</p>
    </div>
  );
}

function HabitInsightCard({ item, completions, onToggle, t }) {
  const { current, best, rate, total } = computeStats(completions, item.id);
  const map = completions[item.id] || {};
  const cells = gridCells();
  const td = today();

  return (
    <div className="relative bg-card rounded-4xl shadow-soft overflow-hidden p-5 sm:p-6 fade-in">
      <span className="absolute left-0 top-5 bottom-5 w-1 rounded-full" style={{ background: item.color }} />
      <div className="flex items-center justify-between mb-4 pl-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
          <h3 className="font-bold text-[18px]">{item.name}</h3>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => {
            const done = !!map[dateStr(addDays(new Date(), -(6 - i)))];
            return <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: done ? item.color : 'var(--line)' }} />;
          })}
        </div>
      </div>

      <div className="flex gap-2.5 mb-5 pl-2">
        <StatTile icon="flame" value={current} label={t('s_current')} />
        <StatTile icon="trophy" value={best} label={t('s_best')} />
        <StatTile icon="trending" value={rate + '%'} label={t('s_rate')} />
      </div>

      <div className="pl-2">
        <p className="text-faint text-[11px] font-bold tracking-[0.1em] mb-2.5">{t('last_30')}</p>
        <div className="grid grid-cols-7 gap-1.5 mb-2 max-w-[330px]">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="text-center text-faint text-[11px] font-semibold">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 max-w-[330px]">
          {cells.map((c, i) => {
            if (!c) return <span key={i} />;
            const done = !!map[c];
            const isToday = c === td;
            return (
              <button
                key={i}
                onClick={() => onToggle(item.id, c)}
                title={c}
                className="aspect-square rounded-[9px] transition-all duration-150 hover:scale-[1.08]"
                style={{
                  background: done ? item.color : 'var(--cream)',
                  outline: isToday ? '2px solid var(--espresso)' : 'none',
                  outlineOffset: '1px',
                }}
              />
            );
          })}
        </div>
        <p className="text-faint text-[13px] font-medium mt-3.5">{t('total_completions', total)}</p>
      </div>
    </div>
  );
}

function fmtDay(ds, t, lang) {
  const td = today();
  if (ds === td) return t('day_today');
  if (ds === dateStr(addDays(new Date(), -1))) return t('day_yesterday');
  return new Date(ds + 'T00:00:00').toLocaleDateString(localeOf(lang), { weekday: 'long', day: 'numeric', month: 'long' });
}

function TaskLog({ items, completions, t, lang }) {
  // flatten completions into {date, time, name, color}
  const entries = [];
  items.forEach(it => {
    const m = completions[it.id] || {};
    Object.keys(m).forEach(date => {
      entries.push({ date, time: typeof m[date] === 'string' ? m[date] : '', name: it.name, color: it.color });
    });
  });
  const byDate = {};
  entries.forEach(e => { (byDate[e.date] = byDate[e.date] || []).push(e); });
  const dates = Object.keys(byDate).sort().reverse();
  dates.forEach(d => byDate[d].sort((a, b) => (a.time < b.time ? 1 : -1)));

  if (entries.length === 0) {
    return (
      <Card className="py-14 text-center text-faint font-medium px-4">
        {t('no_completed_tasks')}<br />
        <span className="text-[13px]">{t('mark_in_timeline')}</span>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {dates.map(d => (
        <Card key={d} className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[16px] capitalize">{fmtDay(d, t, lang)}</h3>
            <span className="tnum text-[12px] font-bold text-faint bg-cream rounded-full px-2.5 py-1">{byDate[d].length}</span>
          </div>
          <div className="flex flex-col">
            {byDate[d].map((e, i) => (
              <div key={i} className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-t border-line' : ''}`}>
                <span className="tnum text-[13px] font-bold text-muted w-12 shrink-0">{e.time || '—'}</span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--done-edge)' }} />
                <p className="font-semibold text-[15px] flex-1 min-w-0 truncate">{e.name}</p>
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--done-bg)' }}>
                  <Icon name="check" size={14} stroke={3} style={{ color: 'var(--done-edge)' }} />
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function InsightsView({ store }) {
  const { state, toggleComplete } = store;
  const t = makeT(state.lang);
  const [tab, setTab] = useStateC('habit');
  const td = today();
  const items = state.items.filter(i => i.type === tab);

  // habit metrics
  const todayDone = items.filter(i => state.completions[i.id]?.[td]).length;
  const avgRate = items.length
    ? Math.round(items.reduce((a, i) => a + computeStats(state.completions, i.id).rate, 0) / items.length)
    : 0;
  const bestStreak = items.reduce((a, i) => Math.max(a, computeStats(state.completions, i.id).best), 0);

  // task metrics (completion counts)
  const taskToday = items.reduce((a, i) => a + (state.completions[i.id]?.[td] ? 1 : 0), 0);
  let taskWeek = 0, taskTotal = 0;
  items.forEach(i => {
    const m = state.completions[i.id] || {};
    Object.keys(m).forEach(date => {
      taskTotal++;
      for (let k = 0; k < 7; k++) if (date === dateStr(addDays(new Date(), -k))) taskWeek++;
    });
  });

  return (
    <div className="fade-in">
      <div className="mb-7">
        <p className="text-muted font-medium text-[15px]">{t('your_progress')}</p>
        <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-[1.05] mt-1">{t('insights')}</h1>
      </div>

      <div className="mb-6">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[{ value: 'habit', label: t('type_habits') }, { value: 'task', label: t('type_tasks') }]}
        />
      </div>

      {tab === 'habit' ? (
        <React.Fragment>
          <Card className="p-6 mb-6 flex items-center">
            <MetricCell value={`${todayDone}/${items.length}`} label={t('m_today')} />
            <span className="w-px h-10 bg-line" />
            <MetricCell value={`${avgRate}%`} label={t('m_avg')} />
            <span className="w-px h-10 bg-line" />
            <MetricCell value={bestStreak} label={t('m_best_streak')} />
          </Card>
          <div className="flex flex-col gap-5">
            {items.map(it => (
              <HabitInsightCard key={it.id} item={it} completions={state.completions} onToggle={toggleComplete} t={t} />
            ))}
            {items.length === 0 && (
              <Card className="py-14 text-center text-faint font-medium">{t('no_habits')}</Card>
            )}
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Card className="p-6 mb-6 flex items-center">
            <MetricCell value={taskToday} label={t('m_today')} />
            <span className="w-px h-10 bg-line" />
            <MetricCell value={taskWeek} label={t('m_week')} />
            <span className="w-px h-10 bg-line" />
            <MetricCell value={taskTotal} label={t('m_total')} />
          </Card>
          <p className="text-faint text-[11px] font-bold tracking-[0.1em] mb-3 px-1">{t('completed_tasks')}</p>
          <TaskLog items={items} completions={state.completions} t={t} lang={state.lang} />
        </React.Fragment>
      )}
    </div>
  );
}

window.InsightsView = InsightsView;
