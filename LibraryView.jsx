// Library — clean MS-To-Do-style rows. A tap opens the detail drawer;
// the left circle toggles done, the right star flags importance.
// Sub-steps live inside the drawer, so the library lists only root items.

const HORIZON_RANK = { today: 0, week: 1, month: 2, year: 3 };
const horizonRank = h => (h in HORIZON_RANK ? HORIZON_RANK[h] : 4);

function dueLabel(due, t) {
  const td = today();
  const tm = dateStr(addDays(new Date(), 1));
  if (due === td) return { label: t('due_today'), overdue: false };
  if (due === tm) return { label: t('due_tomorrow'), overdue: false };
  const d = new Date(due + 'T00:00:00').toLocaleDateString(localeOf('tr'), { day: 'numeric', month: 'short' });
  return { label: d, overdue: due < td };
}

// secondary meta line under the title
function RowMeta({ it, state, t }) {
  const bits = [];
  const td = today();
  if (it.myDay === td) bits.push(<span key="md" className="inline-flex items-center gap-1" style={{ color: 'var(--accent)' }}><Icon name="sunrise" size={13} />{t('myday_title')}</span>);
  if (it.horizon) bits.push(<span key="hz">{t('h_' + it.horizon)}</span>);
  if (it.due) { const d = dueLabel(it.due, t); bits.push(<span key="due" className="inline-flex items-center gap-1" style={d.overdue ? { color: 'var(--danger)' } : undefined}><Icon name="calendar" size={13} />{d.label}{it.dueTime ? ' · ' + it.dueTime : ''}</span>); }
  const prog = stepsProgress(state, it.id);
  if (prog) bits.push(<span key="st" className="inline-flex items-center gap-1"><Icon name="subtask" size={13} />{prog.done}/{prog.total}</span>);
  if (it.remind) bits.push(<span key="rm" className="inline-flex items-center gap-1 tnum"><Icon name="alarm" size={13} />{it.remind}</span>);
  if (it.repeat) bits.push(<span key="rp" className="inline-flex items-center gap-1"><Icon name="repeat" size={13} />{t('rep_' + it.repeat)}</span>);
  if (it.note) bits.push(<Icon key="nt" name="note" size={13} />);
  if (it.eisen) bits.push(<span key="ei" className="w-2 h-2 rounded-full inline-block" style={{ background: EISEN[it.eisen].color }} />);
  if (!bits.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-faint text-[12.5px] font-semibold">
      {bits.map((b, i) => <span key={i} className="inline-flex items-center">{b}</span>)}
    </div>
  );
}

function LibRow({ it, store, t, onOpen, onDragStart, draggable, sortable }) {
  const { toggleComplete, toggleFlag, reorderItems } = store;
  const done = isDone(store.state, it.id);
  const canComplete = it.type === 'task';
  const [dropHint, setDropHint] = useStateC(false);
  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? (e => onDragStart(e, it.id)) : undefined}
      onDragOver={sortable ? (e => { e.preventDefault(); e.stopPropagation(); if (!dropHint) setDropHint(true); }) : undefined}
      onDragLeave={sortable ? (() => setDropHint(false)) : undefined}
      onDrop={sortable ? (e => { e.preventDefault(); e.stopPropagation(); setDropHint(false); const id = e.dataTransfer.getData('text/plain'); if (id && id !== it.id) reorderItems(id, it.id); }) : undefined}
      onClick={() => onOpen(it.id)}
      className="group relative rounded-2xl p-3.5 pl-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-cream/50"
      style={{ background: 'var(--bg)', boxShadow: dropHint ? 'inset 0 3px 0 -1px var(--espresso)' : 'none' }}
    >
      <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full" style={{ background: it.color }} />
      {draggable && (
        <span onClick={e => e.stopPropagation()} className="shrink-0 text-faint/60 cursor-grab active:cursor-grabbing hidden sm:block" title={sortable ? t('drag_reorder') : t('lib_drag_hint')} aria-hidden="true">
          <Icon name="grip" size={15} />
        </span>
      )}
      {canComplete ? (
        <button
          onClick={e => { e.stopPropagation(); const was = done; toggleComplete(it.id, today()); if (!was) toast(`${it.name} · ${t('toast_completed')}`, t('undo'), () => toggleComplete(it.id, today())); }}
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all active:scale-90"
          style={{ borderColor: done ? 'var(--done-edge)' : it.color, background: done ? 'var(--done-edge)' : 'transparent' }}
          aria-label={t('mark_complete')}
        >
          {done && <Icon name="check" size={13} stroke={3} className="text-white pop" />}
        </button>
      ) : (
        <span className="w-2.5 h-2.5 rounded-full shrink-0 ml-1.5" style={{ background: it.color }} />
      )}
      <div className="min-w-0 flex-1">
        <p className={`font-bold text-[15.5px] leading-tight truncate ${done ? 'line-through text-faint' : 'text-ink'}`}>{it.name}</p>
        <RowMeta it={it} state={store.state} t={t} />
      </div>
      <button
        onClick={e => { e.stopPropagation(); toggleFlag(it.id); }}
        className="p-1.5 shrink-0 transition-colors"
        style={{ color: it.flag ? 'var(--accent)' : 'var(--faint)' }}
        aria-label={it.flag ? t('unmark_important') : t('mark_important')}
      >
        <Icon name="star" size={17} style={{ fill: it.flag ? 'var(--accent)' : 'none' }} />
      </button>
      <span className="shrink-0 text-faint/70 group-hover:text-espresso transition-colors" aria-hidden="true"><Icon name="chevron" size={16} /></span>
    </div>
  );
}

function AddItemInline({ tab, categoryId, addItem, t }) {
  const [name, setName] = useStateC('');
  function submit() { if (!name.trim()) return; addItem(name, tab, 'today', categoryId, null); setName(''); }
  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder={tab === 'habit' ? t('add_habit_ph') : t('add_task_ph')}
        className="flex-1 bg-transparent rounded-xl px-3 py-2.5 text-[15px] font-semibold text-ink placeholder:text-faint border border-line focus:border-espresso/40 outline-none"
      />
      <button onClick={submit} disabled={!name.trim()} className="px-4 rounded-xl font-bold text-cream text-[14px] transition-opacity disabled:opacity-30 shrink-0" style={{ background: 'var(--espresso)' }}>{t('add')}</button>
    </div>
  );
}

// small colour swatch picker for a category
function CatColorDot({ cat, setCategoryColor }) {
  const [open, setOpen] = useStateC(false);
  const color = cat.color || 'var(--faint)';
  return (
    <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} className="w-4 h-4 rounded-full transition-transform active:scale-90" style={{ background: color, boxShadow: '0 0 0 2px var(--card), 0 0 0 3.5px var(--line)' }} aria-label="renk" />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-6 left-0 bg-card rounded-2xl shadow-lift p-2.5 grid grid-cols-4 gap-2" style={{ border: '1px solid var(--line)' }}>
            {CAT_PALETTE.map(c => (
              <button key={c} onClick={() => { setCategoryColor(cat.id, c); setOpen(false); }} className="w-6 h-6 rounded-full transition-transform hover:scale-110" style={{ background: c, outline: cat.color === c ? '2px solid var(--ink)' : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Disclosure({ label, count, children, defaultOpen = false, accent }) {
  const [open, setOpen] = useStateC(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 text-faint hover:text-muted transition-colors py-1">
        <span className="transition-transform" style={{ transform: open ? 'rotate(90deg)' : 'none', transitionDuration: '.22s' }}><Icon name="chevron" size={15} /></span>
        <span className="text-[12px] font-bold tracking-[0.06em] uppercase">{label}</span>
        <span className="tnum text-[11px] font-bold text-faint bg-cream rounded-full px-1.5 py-0.5">{count}</span>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .24s ease' }}>
        <div style={{ overflow: 'hidden' }}><div className="pt-2 flex flex-col gap-2">{children}</div></div>
      </div>
    </div>
  );
}

function CategorySection({ cat, activeItems, doneItems, expanded, onToggle, tab, store, deletable, onOpen, sortable }) {
  const { addItem, renameCategory, removeCategory, moveItemCategory, setCategoryColor } = store;
  const t = makeT(store.state.lang);
  const nameRef = useRefC(null);
  const [dragOver, setDragOver] = useStateC(false);
  const targetCat = cat.id === 'none' ? null : cat.id;

  const dragStart = (e, id) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; e.stopPropagation(); };
  const onDrop = e => {
    e.preventDefault(); setDragOver(false);
    const id = e.dataTransfer.getData('text/plain');
    const moved = store.state.items.find(i => i.id === id);
    if (id && moved && moved.type === tab && (moved.categoryId || null) !== targetCat) moveItemCategory(id, targetCat);
  };

  return (
    <Card
      className="overflow-hidden"
      style={dragOver ? { outline: '2px solid var(--espresso)', outlineOffset: '-2px', background: 'var(--cream)' } : undefined}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (!dragOver) setDragOver(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 p-4 sm:p-5">
        <button onClick={onToggle} className="p-1 text-muted hover:text-ink transition-transform shrink-0" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .25s ease' }} aria-label={expanded ? t('collapse') : t('expand')}>
          <Icon name="chevron" size={20} />
        </button>
        {deletable && <CatColorDot cat={cat} setCategoryColor={setCategoryColor} />}
        {deletable ? (
          <input
            ref={nameRef}
            value={cat.name}
            onChange={e => renameCategory(cat.id, e.target.value)}
            onBlur={e => { if (!e.target.value.trim()) renameCategory(cat.id, 'Kategori'); }}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
            className="font-extrabold text-[18px] flex-1 min-w-0 bg-transparent outline-none rounded-lg px-1.5 -mx-1 py-0.5 hover:bg-cream focus:bg-cream transition-colors"
            aria-label={t('category_name')}
          />
        ) : (
          <h3 className="font-extrabold text-[18px] flex-1 min-w-0 px-1.5">{cat.name}</h3>
        )}
        <span className="tnum text-[12px] font-bold text-faint bg-cream rounded-full px-2.5 py-1 shrink-0">{activeItems.length}</span>
        {deletable && (
          <button onClick={() => { if (confirm(t('cat_delete_confirm', cat.name))) removeCategory(cat.id); }} className="text-faint hover:text-danger transition-colors p-1.5 shrink-0" aria-label={t('delete_category')}>
            <Icon name="trash" size={17} />
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows .28s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="px-4 sm:px-5 pb-4 flex flex-col gap-2">
            {activeItems.map(it => (
              <LibRow key={it.id} it={it} store={store} t={t} onOpen={onOpen} onDragStart={dragStart} draggable sortable={sortable} />
            ))}
            {activeItems.length === 0 && doneItems.length === 0 && <p className="text-faint text-[14px] font-medium px-1 py-1">{t('cat_empty')}</p>}
            <AddItemInline tab={tab} categoryId={cat.id === 'none' ? null : cat.id} addItem={addItem} t={t} />
            {doneItems.length > 0 && (
              <div className="mt-1">
                <Disclosure label={t('completed_section')} count={doneItems.length}>
                  {doneItems.map(it => <LibRow key={it.id} it={it} store={store} t={t} onOpen={onOpen} onDragStart={dragStart} draggable={false} />)}
                </Disclosure>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function LibraryView({ store, onOpen }) {
  const { state, addCategory } = store;
  const t = makeT(state.lang);
  const [tab, setTab] = useStateC('habit');
  const [open, setOpen] = useStateC({});
  const [newCat, setNewCat] = useStateC('');
  const [query, setQuery] = useStateC('');
  const [filter, setFilter] = useStateC('all');  // all | important | planned
  const [sort, setSort] = useStateC(() => localStorage.getItem('ritual.sort') || 'manual');
  React.useEffect(() => { localStorage.setItem('ritual.sort', sort); }, [sort]);

  const toggle = id => setOpen(o => ({ ...o, [id]: o[id] === undefined ? false : !o[id] }));
  const isOpen = id => open[id] !== false;

  const byH = (a, b) => horizonRank(a.horizon) - horizonRank(b.horizon);
  function sortItems(list) {
    const arr = [...list];
    if (sort === 'date') arr.sort((a, b) => (!a.due && !b.due) ? 0 : !a.due ? 1 : !b.due ? -1 : (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
    else if (sort === 'starred') arr.sort((a, b) => (b.flag ? 1 : 0) - (a.flag ? 1 : 0));
    return arr;  // 'manual' keeps natural (insertion) order
  }
  // library shows only root items (steps live in the drawer)
  const root = i => i.type === tab && !i.parentId;
  const doneT = i => i.type === 'task' && isDone(state, i.id);

  const q = query.trim().toLowerCase();
  const matchFilter = i => filter === 'all' ? true : filter === 'important' ? i.flag : !!i.due;
  const searching = q.length > 0 || filter !== 'all';

  const cats = state.categories.filter(c => c.type === tab);
  const catIds = new Set(cats.map(c => c.id));
  const inCat = (id, i) => (i.categoryId === id) || (id === null && (!i.categoryId || !catIds.has(i.categoryId)));

  const activeOf = id => sortItems(state.items.filter(i => root(i) && inCat(id, i) && !doneT(i)));
  const doneOf = id => sortItems(state.items.filter(i => root(i) && inCat(id, i) && doneT(i)));

  const todayCount = state.items.filter(i => i.horizon === 'today' && root(i) && !doneT(i)).length;
  function addCat() { if (!newCat.trim()) return; addCategory(newCat, tab, CAT_PALETTE[state.categories.length % CAT_PALETTE.length]); setNewCat(''); }

  // flat search/filter results
  const flatResults = sortItems(state.items.filter(i => root(i) && matchFilter(i) && (!q || i.name.toLowerCase().includes(q))))
    .sort((a, b) => (doneT(a) - doneT(b)));
  const sortable = sort === 'manual' && !searching;

  const FILTERS = [
    { v: 'all', label: t('filter_all'), icon: 'list' },
    { v: 'important', label: t('filter_important'), icon: 'star' },
    { v: 'planned', label: t('filter_planned'), icon: 'calendar' },
  ];
  const SORTS = [
    { v: 'manual', label: t('sort_manual') },
    { v: 'date', label: t('sort_date') },
    { v: 'starred', label: t('sort_starred') },
  ];

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-[1.05] mt-1">{t('library')}</h1>
        <p className="text-faint font-medium mt-2">{t('tagged_today', todayCount)}</p>
      </div>

      <Segmented
        value={tab}
        onChange={v => { setTab(v); setFilter('all'); setQuery(''); }}
        options={[{ value: 'habit', label: t('type_habits') }, { value: 'task', label: t('type_tasks') }]}
      />

      {/* search + smart filters */}
      <div className="mt-4 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-faint"><Icon name="search" size={17} /></span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('search_ph')}
          className="w-full bg-card rounded-2xl pl-11 pr-4 py-3 font-semibold text-ink placeholder:text-faint border border-line focus:border-espresso/30 outline-none shadow-soft"
        />
        {query && <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink p-1"><Icon name="x" size={16} /></button>}
      </div>
      <div className="flex items-center gap-1.5 mt-3 mb-1">
        {FILTERS.map(f => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150"
            style={filter === f.v ? { background: 'var(--espresso)', color: 'var(--card)' } : { color: 'var(--faint)', background: 'var(--cream)' }}
          >
            <Icon name={f.icon} size={14} /> {f.label}
          </button>
        ))}
      </div>

      {/* sort mode */}
      <div className="flex items-center gap-2 mt-2 mb-1">
        <span className="text-faint text-[12px] font-bold tracking-[0.06em] uppercase shrink-0">{t('sort_label')}</span>
        <div className="flex items-center gap-1">
          {SORTS.map(sm => (
            <button
              key={sm.v}
              onClick={() => setSort(sm.v)}
              className="px-3 py-1 rounded-full text-[12.5px] font-semibold transition-all duration-150"
              style={sort === sm.v ? { background: 'var(--cream)', color: 'var(--ink)' } : { color: 'var(--faint)' }}
            >
              {sm.label}
            </button>
          ))}
        </div>
      </div>

      {searching ? (
        <div className="mt-4 flex flex-col gap-2">
          {flatResults.length === 0 ? (
            <Card className="py-12 text-center text-faint font-medium px-4">{t('no_results')}</Card>
          ) : (
            <Card className="p-3 sm:p-4 flex flex-col gap-2">
              {flatResults.map(it => <LibRow key={it.id} it={it} store={store} t={t} onOpen={onOpen} onDragStart={() => {}} draggable={false} />)}
            </Card>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2.5 mt-5 mb-2">
            <input
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCat()}
              placeholder={tab === 'habit' ? t('new_cat_habit') : t('new_cat_task')}
              className="flex-1 bg-card rounded-2xl px-4 py-3.5 font-semibold text-ink placeholder:text-faint border border-line focus:border-espresso/30 outline-none shadow-soft"
            />
            <button onClick={addCat} disabled={!newCat.trim()} className="px-5 rounded-2xl font-bold text-cream transition-opacity disabled:opacity-40 flex items-center gap-1.5 shrink-0" style={{ background: 'var(--espresso)' }}>
              <Icon name="layers" size={17} /> {t('category_btn')}
            </button>
          </div>
          <p className="text-faint text-[13px] font-medium mt-2 mb-5 px-1">{t('lib_hint')}</p>

          <div className="flex flex-col gap-3">
            {cats.map(c => (
              <CategorySection key={c.id} cat={c} activeItems={activeOf(c.id)} doneItems={doneOf(c.id)} expanded={isOpen(c.id)} onToggle={() => toggle(c.id)} tab={tab} store={store} onOpen={onOpen} deletable sortable={sortable} />
            ))}
            {(activeOf(null).length > 0 || doneOf(null).length > 0) && (
              <CategorySection cat={{ id: 'none', name: t('uncategorized') }} activeItems={activeOf(null)} doneItems={doneOf(null)} expanded={isOpen('none')} onToggle={() => toggle('none')} tab={tab} store={store} onOpen={onOpen} deletable={false} sortable={sortable} />
            )}
            {cats.length === 0 && activeOf(null).length === 0 && doneOf(null).length === 0 && (
              <div className="bg-card rounded-4xl shadow-soft py-12 text-center text-faint font-medium px-4">{t('no_categories')}</div>
            )}
          </div>
        </>
      )}
      <div className="h-10" />
    </div>
  );
}

window.LibraryView = LibraryView;
