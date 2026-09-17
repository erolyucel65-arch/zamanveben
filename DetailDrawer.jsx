// Right-side detail panel for a habit/task — houses My Day, reminder, due date,
// repeat, importance, priority, horizon, steps (subtasks) and a free note.

function DrawerRow({ icon, iconColor, label, sub, right, onClick, divider }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left ${onClick ? 'transition-colors hover:bg-cream/50' : ''} ${divider ? 'border-t border-line' : ''}`}
    >
      <span className="shrink-0" style={{ color: iconColor || 'var(--espresso)' }}><Icon name={icon} size={19} /></span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[15px] text-ink leading-tight">{label}</p>
        {sub && <p className="text-faint text-[12.5px] font-medium mt-0.5 truncate">{sub}</p>}
      </div>
      {right !== undefined && <div className="shrink-0">{right}</div>}
    </Tag>
  );
}

function MiniChips({ label, opts, value, onChange }) {
  return (
    <div className="px-4 py-3.5 border-t border-line">
      <p className="text-faint text-[11px] font-bold tracking-[0.1em] mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {opts.map(o => {
          const active = (value || null) === o.v;
          return (
            <button
              key={String(o.v)}
              onClick={() => onChange(o.v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150"
              style={active
                ? (o.color ? { background: o.color, color: '#fff' } : { background: 'var(--espresso)', color: 'var(--card)' })
                : { color: 'var(--faint)', background: 'var(--cream)' }}
            >
              {o.color && <span className="w-2 h-2 rounded-full" style={{ background: active ? '#fff' : o.color }} />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// due date → friendly label + tone
function dueMeta(due, dueTime, t) {
  if (!due) return null;
  const td = today();
  const tm = dateStr(addDays(new Date(), 1));
  let label;
  if (due === td) label = t('due_today');
  else if (due === tm) label = t('due_tomorrow');
  else label = new Date(due + 'T00:00:00').toLocaleDateString(localeOf('tr'), { day: 'numeric', month: 'long' });
  if (dueTime) label += ' · ' + dueTime;
  const overdue = due < td;
  return { label: overdue ? `${label} · ${t('overdue')}` : label, overdue };
}

function StepRow({ kid, store, t }) {
  const { toggleComplete, renameItem, removeItem } = store;
  const done = isDone(store.state, kid.id);
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <button
        onClick={() => toggleComplete(kid.id, today())}
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all active:scale-90"
        style={{ borderColor: done ? 'var(--done-edge)' : 'var(--faint)', background: done ? 'var(--done-edge)' : 'transparent' }}
        aria-label={t('done')}
      >
        {done && <Icon name="check" size={13} stroke={3} className="text-white" />}
      </button>
      <input
        value={kid.name}
        onChange={e => renameItem(kid.id, e.target.value)}
        onKeyDown={e => e.key === 'Enter' && e.target.blur()}
        className={`flex-1 min-w-0 bg-transparent outline-none text-[14.5px] font-semibold rounded-lg px-1.5 -mx-1 py-0.5 hover:bg-cream/60 focus:bg-cream transition-colors ${done ? 'line-through text-faint' : 'text-ink'}`}
      />
      <button onClick={() => removeItem(kid.id)} className="text-faint hover:text-danger transition-colors p-1 shrink-0" aria-label={t('delete')}>
        <Icon name="x" size={15} />
      </button>
    </div>
  );
}

function DetailDrawer({ store, itemId, onClose }) {
  const t = makeT(store.state.lang);
  const { state, renameItem, removeItem, setNote, setDue, setDueTime, setEstimate, setRemind, setRepeat, toggleFlag, toggleMyDay, setEisen, setHorizon, toggleComplete, addItem, moveItemCategory, undoRemove } = store;
  const item = state.items.find(i => i.id === itemId);
  const [shown, setShown] = useStateC(false);
  const [stepName, setStepName] = useStateC('');
  const [showList, setShowList] = useStateC(false);

  React.useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);
  React.useEffect(() => { if (!item) onClose(); }, [item]);

  function close() { setShown(false); setTimeout(onClose, 280); }

  if (!item) return null;
  const td = today();
  const done = isDone(state, item.id);
  const inMyDay = item.myDay === td;
  const isTask = item.type === 'task';
  const kids = state.items.filter(i => i.parentId === item.id);
  const prog = stepsProgress(state, item.id);
  const due = dueMeta(item.due, item.dueTime, t);
  const cats = state.categories.filter(c => c.type === item.type);
  const curCat = state.categories.find(c => c.id === item.categoryId);

  const EI_OPTS = [
    { v: 'do', label: t('eisen_do'), color: EISEN.do.color },
    { v: 'plan', label: t('eisen_plan'), color: EISEN.plan.color },
    { v: 'delegate', label: t('eisen_delegate'), color: EISEN.delegate.color },
    { v: 'drop', label: t('eisen_drop'), color: EISEN.drop.color },
    { v: null, label: t('eisen_none') },
  ];
  const HZ_OPTS = [
    { v: 'today', label: t('h_today') }, { v: 'week', label: t('h_week') },
    { v: 'month', label: t('h_month') }, { v: 'year', label: t('h_year') }, { v: null, label: t('h_none') },
  ];
  const REP_OPTS = ['daily', 'weekdays', 'weekly', 'monthly'].map(v => ({ v, label: t('rep_' + v) }));
  REP_OPTS.unshift({ v: null, label: t('rep_none') });

  function addStep() {
    if (!stepName.trim()) return;
    addItem(stepName, 'task', item.horizon, item.categoryId, item.id);
    setStepName('');
  }

  const clearBtn = (onClick) => (
    <button onClick={onClick} className="text-faint hover:text-danger transition-colors p-1" aria-label={t('clear_field')}>
      <Icon name="x" size={16} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" aria-modal="true" role="dialog">
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(34,24,16,.42)', opacity: shown ? 1 : 0 }}
        onClick={close}
      />
      <div
        className="relative h-full w-full max-w-[440px] bg-bg shadow-lift flex flex-col"
        style={{
          transform: shown ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .32s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        {/* header */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-line shrink-0">
          <button onClick={close} className="p-1.5 text-muted hover:text-ink -ml-1.5" aria-label={t('collapse')}>
            <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}><Icon name="login" size={19} /></span>
          </button>
          <p className="text-faint text-[12px] font-bold tracking-[0.1em] uppercase flex-1">{isTask ? t('detail_task') : t('detail_habit')}</p>
          <button
            onClick={() => toggleFlag(item.id)}
            className="p-1.5 transition-colors"
            style={{ color: item.flag ? 'var(--accent)' : 'var(--faint)' }}
            aria-label={item.flag ? t('unmark_important') : t('mark_important')}
          >
            <Icon name="star" size={19} style={{ fill: item.flag ? 'var(--accent)' : 'none' }} />
          </button>
          <button onClick={() => { const nm = item.name; removeItem(item.id); toast(`${nm} · ${t('toast_deleted')}`, t('undo'), () => undoRemove()); close(); }} className="p-1.5 text-faint hover:text-danger" aria-label={t('delete')}>
            <Icon name="trash" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* name + complete */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleComplete(item.id, td)}
                className="mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all active:scale-90"
                style={{ borderColor: done ? 'var(--done-edge)' : item.color, background: done ? 'var(--done-edge)' : 'transparent' }}
                aria-label={t('mark_complete')}
              >
                {done && <Icon name="check" size={17} stroke={3} className="text-white pop" />}
              </button>
              <textarea
                value={item.name}
                onChange={e => renameItem(item.id, e.target.value)}
                rows={1}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                className={`flex-1 min-w-0 bg-transparent outline-none resize-none text-[22px] font-extrabold leading-tight tracking-tight pt-0.5 ${done ? 'line-through text-faint' : 'text-ink'}`}
              />
            </div>
          </div>

          {/* My Day + scheduling card */}
          <div className="mx-4 mb-4 bg-card rounded-4xl shadow-soft overflow-hidden">
            <DrawerRow
              icon="sunrise"
              iconColor={inMyDay ? 'var(--accent)' : undefined}
              label={inMyDay ? t('in_myday') : t('add_to_myday')}
              right={<Switch on={inMyDay} onChange={() => toggleMyDay(item.id)} />}
            />
            <DrawerRow
              icon="alarm" divider
              label={t('reminder')}
              sub={item.remind || undefined}
              right={
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={item.remind || ''}
                    onChange={e => setRemind(item.id, e.target.value || null)}
                    className="tnum text-[14px] font-bold text-ink bg-cream rounded-xl px-2.5 py-1.5 border border-line outline-none focus:border-espresso/40"
                  />
                  {item.remind && clearBtn(() => setRemind(item.id, null))}
                </div>
              }
            />
            <div className="px-4 py-3.5 border-t border-line">
              <div className="flex items-center gap-3.5">
                <span className="shrink-0" style={{ color: due && due.overdue ? 'var(--danger)' : 'var(--espresso)' }}><Icon name="calendar" size={19} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[15px] text-ink leading-tight">{t('due_date')}</p>
                  {due && <p className="text-[12.5px] font-medium mt-0.5 truncate" style={{ color: due.overdue ? 'var(--danger)' : 'var(--faint)' }}>{due.label}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="date"
                    value={item.due || ''}
                    onChange={e => setDue(item.id, e.target.value || null)}
                    className="tnum text-[13px] font-bold text-ink bg-cream rounded-xl px-2.5 py-1.5 border border-line outline-none focus:border-espresso/40"
                  />
                  {item.due && clearBtn(() => setDue(item.id, null))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pl-[34px] mt-2.5">
                {[{ label: t('q_today'), off: 0 }, { label: t('q_tomorrow'), off: 1 }, { label: t('q_nextweek'), off: 7 }].map(q => {
                  const ds = dateStr(addDays(new Date(), q.off));
                  const active = item.due === ds;
                  return (
                    <button
                      key={q.label}
                      onClick={() => setDue(item.id, ds)}
                      className="px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150"
                      style={active ? { background: 'var(--espresso)', color: 'var(--card)' } : { color: 'var(--faint)', background: 'var(--cream)' }}
                    >
                      {q.label}
                    </button>
                  );
                })}
                {item.due && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Icon name="clock" size={14} className="text-faint" />
                    <input
                      type="time"
                      value={item.dueTime || ''}
                      onChange={e => setDueTime(item.id, e.target.value || null)}
                      className="tnum text-[13px] font-bold text-ink bg-cream rounded-xl px-2.5 py-1.5 border border-line outline-none focus:border-espresso/40"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3.5 border-t border-line">
              <div className="flex items-center gap-3.5 mb-2.5">
                <span className="shrink-0 text-espresso"><Icon name="clock" size={19} /></span>
                <p className="font-bold text-[15px] text-ink flex-1">{t('estimate_label')}</p>
                {item.estimate && <span className="tnum text-[13px] font-bold text-faint">{item.estimate}{t('min_suffix')}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 pl-[34px]">
                {[15, 30, 45, 60, 90, 120].map(m => {
                  const active = item.estimate === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setEstimate(item.id, active ? null : m)}
                      className="px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150 tnum"
                      style={active ? { background: 'var(--espresso)', color: 'var(--card)' } : { color: 'var(--faint)', background: 'var(--cream)' }}
                    >
                      {m}{t('min_suffix')}
                    </button>
                  );
                })}
              </div>
              <p className="text-[12.5px] text-faint font-medium pl-[34px] mt-2" style={{ textWrap: 'pretty' }}>{t('estimate_hint')}</p>
            </div>
            <div className="px-4 py-3.5 border-t border-line">
              <div className="flex items-center gap-3.5 mb-2.5">
                <span className="shrink-0 text-espresso"><Icon name="repeat" size={19} /></span>
                <p className="font-bold text-[15px] text-ink flex-1">{t('repeat_label')}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-[34px]">
                {REP_OPTS.map(o => {
                  const active = (item.repeat || null) === o.v;
                  return (
                    <button
                      key={String(o.v)}
                      onClick={() => setRepeat(item.id, o.v)}
                      className="px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150"
                      style={active ? { background: 'var(--espresso)', color: 'var(--card)' } : { color: 'var(--faint)', background: 'var(--cream)' }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* move to list */}
          <div className="mx-4 mb-4 bg-card rounded-4xl shadow-soft relative">
            <DrawerRow
              icon="layers"
              label={t('move_to_list')}
              sub={curCat ? curCat.name : t('uncategorized')}
              right={<span className="text-faint" style={{ transform: showList ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform .2s' }}><Icon name="chevron" size={18} /></span>}
              onClick={() => setShowList(v => !v)}
            />
            {showList && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-card rounded-2xl shadow-lift p-1.5 max-h-[240px] overflow-y-auto" style={{ border: '1px solid var(--line)' }}>
                {cats.map(c => (
                  <button key={c.id} onClick={() => { moveItemCategory(item.id, c.id); setShowList(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left font-semibold text-[14.5px] hover:bg-cream transition-colors" style={{ color: item.categoryId === c.id ? 'var(--espresso)' : 'var(--ink)' }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color || 'var(--faint)' }} />
                    <span className="flex-1 min-w-0 truncate">{c.name}</span>
                    {item.categoryId === c.id && <Icon name="check" size={15} stroke={3} className="text-espresso shrink-0" />}
                  </button>
                ))}
                <button onClick={() => { moveItemCategory(item.id, null); setShowList(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left font-semibold text-[14.5px] hover:bg-cream transition-colors text-muted">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--faint)' }} />
                  <span className="flex-1 min-w-0 truncate">{t('uncategorized')}</span>
                  {!item.categoryId && <Icon name="check" size={15} stroke={3} className="text-espresso shrink-0" />}
                </button>
              </div>
            )}
          </div>

          {/* priority + horizon */}
          <div className="mx-4 mb-4 bg-card rounded-4xl shadow-soft overflow-hidden">
            <MiniChips label={t('priority_label')} opts={EI_OPTS} value={item.eisen} onChange={v => setEisen(item.id, v)} />
            <MiniChips label={t('label_tag')} opts={HZ_OPTS} value={item.horizon} onChange={v => setHorizon(item.id, v)} />
          </div>

          {/* steps (tasks only) */}
          {isTask && (
            <div className="mx-4 mb-4 bg-card rounded-4xl shadow-soft overflow-hidden">
              <div className="px-4 pt-4 pb-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 font-bold text-[15px]">
                    <Icon name="subtask" size={18} className="text-espresso" /> {t('steps')}
                  </div>
                  {prog && <span className="tnum text-[12px] font-bold text-faint">{t('steps_count', prog.done, prog.total)}</span>}
                </div>
                {prog && (
                  <div className="h-1.5 rounded-full bg-cream overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${(prog.done / prog.total) * 100}%`, background: 'var(--done-edge)', transition: 'width .3s ease' }} />
                  </div>
                )}
                <div className="flex flex-col">
                  {kids.map(k => <StepRow key={k.id} kid={k} store={store} t={t} />)}
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4 pt-2">
                <input
                  value={stepName}
                  onChange={e => setStepName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addStep(); }}
                  placeholder={t('step_ph')}
                  className="flex-1 bg-cream rounded-xl px-3 py-2.5 text-[14px] font-semibold text-ink placeholder:text-faint border border-line focus:border-espresso/40 outline-none"
                />
                <button onClick={addStep} disabled={!stepName.trim()} className="px-4 rounded-xl font-bold text-cream text-[14px] transition-opacity disabled:opacity-30 shrink-0" style={{ background: 'var(--espresso)' }}>{t('add')}</button>
              </div>
            </div>
          )}

          {/* note */}
          <div className="mx-4 mb-6 bg-card rounded-4xl shadow-soft overflow-hidden">
            <div className="px-4 pt-4 pb-4">
              <div className="flex items-center gap-2.5 font-bold text-[15px] mb-2.5">
                <Icon name="note" size={18} className="text-espresso" /> {t('note_label')}
              </div>
              <textarea
                value={item.note || ''}
                onChange={e => setNote(item.id, e.target.value)}
                placeholder={t('note_ph')}
                rows={3}
                className="w-full bg-cream rounded-2xl px-3.5 py-3 text-[14.5px] font-medium text-ink placeholder:text-faint border border-line focus:border-espresso/40 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DetailDrawer = DetailDrawer;
