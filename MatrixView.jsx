const { useState: useStateMx } = React;

function MxQuad({ q, title, desc, tasks, sel, onTapQuad, onUntag }) {
  const color = EISEN[q].color;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => sel && onTapQuad(q)}
      onKeyDown={e => { if (sel && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onTapQuad(q); } }}
      className="text-left rounded-2xl p-3 sm:p-4 min-h-[150px] flex flex-col transition-colors"
      style={{
        background: `color-mix(in srgb, ${color} 8%, var(--card))`,
        border: `1.5px solid color-mix(in srgb, ${color} 32%, transparent)`,
        cursor: sel ? 'copy' : 'default',
      }}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <p className="font-extrabold text-[14px] sm:text-[15px]">{title}</p>
        <span className="ml-auto tnum text-[11px] font-bold text-faint">{tasks.length}</span>
      </div>
      <p className="text-faint text-[11px] font-medium mb-2.5">{desc}</p>
      <div className="flex flex-col gap-1.5">
        {tasks.map(it => (
          <span key={it.id} className="flex items-center gap-1.5 rounded-lg pl-2 pr-1 py-1.5 text-[13px] font-semibold" style={{ background: 'var(--bg)' }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.color }} />
            <span className="truncate flex-1 min-w-0">{it.name}</span>
            <button onClick={e => { e.stopPropagation(); onUntag(it.id); }} className="shrink-0 text-faint hover:text-danger p-0.5" aria-label="✕">
              <Icon name="x" size={13} stroke={2.6} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ColHead({ children }) {
  return <p className="text-center font-bold text-[12px] tracking-wide text-muted pb-1">{children}</p>;
}

function MatrixView({ store }) {
  const { state, setEisen } = store;
  const t = makeT(state.lang);
  const [sel, setSel] = useStateMx(null);
  const [range, setRange] = useStateMx('today');

  const RANGES = [
    { v: 'today', label: t('r_daily') }, { v: 'week', label: t('r_weekly') },
    { v: 'month', label: t('r_monthly') }, { v: 'year', label: t('r_yearly') },
  ];

  const tasks = state.items.filter(i => i.type === 'task' && i.horizon === range && !isArchived(state, i.id));
  const byQ = q => tasks.filter(i => (i.eisen || null) === q);
  const untagged = tasks.filter(i => !i.eisen);
  if (sel && !tasks.some(tk => tk.id === sel)) { /* sel may have been removed */ }

  function tapQuad(q) { if (sel) { setEisen(sel, q); setSel(null); } }
  function untag(id) { setEisen(id, null); }

  const RowLabel = ({ children }) => (
    <div className="flex items-center justify-center">
      <span className="font-bold text-[12px] tracking-wide text-muted" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{children}</span>
    </div>
  );

  return (
    <div className="fade-in max-w-[820px] mx-auto">
      <div className="mb-6">
        <p className="text-muted font-medium text-[15px]">{t('matrix_eyebrow')}</p>
        <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-[1.05] mt-1">{t('matrix_title')}</h1>
        <p className="text-faint font-medium mt-2">{t('matrix_hint')}</p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-6">
        {RANGES.map(r => (
          <Chip key={r.v} active={range === r.v} dark onClick={() => { setRange(r.v); setSel(null); }}>{r.label}</Chip>
        ))}
      </div>

      {tasks.length === 0 ? (
        <Card className="py-14 text-center text-faint font-medium px-4">{t('no_tasks_matrix')}</Card>
      ) : (
        <React.Fragment>
          {/* Matrix grid: corner + 2 column heads, then 2 rows each (row label + 2 quads) */}
          <div className="grid gap-2.5 sm:gap-3" style={{ gridTemplateColumns: '22px 1fr 1fr' }}>
            <div />
            <ColHead>{t('axis_urgent')}</ColHead>
            <ColHead>{t('axis_not_urgent')}</ColHead>

            <RowLabel>{t('axis_important')}</RowLabel>
            <MxQuad q="do" title={t('q_do')} desc={t('q_do_d')} tasks={byQ('do')} sel={sel} onTapQuad={tapQuad} onUntag={untag} />
            <MxQuad q="plan" title={t('q_plan')} desc={t('q_plan_d')} tasks={byQ('plan')} sel={sel} onTapQuad={tapQuad} onUntag={untag} />

            <RowLabel>{t('axis_not_important')}</RowLabel>
            <MxQuad q="delegate" title={t('q_delegate')} desc={t('q_delegate_d')} tasks={byQ('delegate')} sel={sel} onTapQuad={tapQuad} onUntag={untag} />
            <MxQuad q="drop" title={t('q_drop')} desc={t('q_drop_d')} tasks={byQ('drop')} sel={sel} onTapQuad={tapQuad} onUntag={untag} />
          </div>

          {/* Untagged tray */}
          <p className="text-faint text-[11px] font-bold tracking-[0.1em] mt-7 mb-3 px-1">{t('untagged_tray').toUpperCase()}</p>
          {untagged.length === 0 ? (
            <Card className="py-6 text-center text-faint font-medium px-4">{t('all_tagged')}</Card>
          ) : (
            <Card className="p-4 flex flex-wrap gap-2">
              {untagged.map(it => {
                const isSel = sel === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => setSel(isSel ? null : it.id)}
                    className={`flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full text-[14px] font-semibold border transition-all duration-150
                      ${isSel ? 'text-cream border-transparent' : 'text-ink bg-bg border-line hover:border-espresso/30'}`}
                    style={isSel ? { background: 'var(--espresso)' } : undefined}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: it.color }} />
                    {it.name}
                  </button>
                );
              })}
            </Card>
          )}
        </React.Fragment>
      )}
      <div className="h-10" />
    </div>
  );
}

window.MatrixView = MatrixView;
