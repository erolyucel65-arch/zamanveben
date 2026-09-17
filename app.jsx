const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "espresso",
  "softness": "balanced",
  "typeface": "modern",
  "timelinePos": "bottom"
}/*EDITMODE-END*/;

function RitualTweaks({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Mood" />
      <TweakColor
        label="Palette"
        value={(MOODS[t.mood] || MOODS.espresso).swatch}
        options={Object.values(MOODS).map(m => m.swatch)}
        onChange={(sw) => {
          const key = Object.keys(MOODS).find(k => MOODS[k].swatch[0] === sw[0]) || 'espresso';
          setTweak('mood', key);
        }}
      />
      <TweakSection label="Form" />
      <TweakRadio
        label="Softness"
        value={t.softness}
        options={['sharp', 'balanced', 'pillowy']}
        onChange={(v) => setTweak('softness', v)}
      />
      <TweakSection label="Typeface" />
      <TweakRadio
        label="Personality"
        value={t.typeface}
        options={['modern', 'rounded', 'editorial']}
        onChange={(v) => setTweak('typeface', v)}
      />
      <TweakSection label="Layout" />
      <TweakRadio
        label="Timeline"
        value={t.timelinePos}
        options={['bottom', 'right', 'left']}
        onChange={(v) => setTweak('timelinePos', v)}
      />
    </TweaksPanel>
  );
}

function AddModal({ onClose, onAdd, t }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('habit');
  function submit() {
    if (!name.trim()) return;
    onAdd(name, type);
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(34,24,16,.4)' }} onClick={onClose}>
      <div className="bg-card rounded-4xl shadow-lift w-full max-w-[420px] p-6 pop" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[20px] font-extrabold">{t('add_new')}</h3>
          <button onClick={onClose} className="text-faint hover:text-ink p-1"><Icon name="x" size={20} /></button>
        </div>
        <Segmented
          value={type} onChange={setType}
          options={[{ value: 'habit', label: t('type_habit_sing') }, { value: 'task', label: t('type_task_sing') }]}
        />
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={type === 'habit' ? t('add_ph_habit') : t('add_ph_task')}
          className="w-full mt-4 bg-cream rounded-2xl px-4 py-3.5 font-semibold text-ink placeholder:text-faint border border-transparent focus:border-espresso/30 outline-none"
        />
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="w-full mt-4 py-3.5 rounded-2xl font-bold text-cream transition-opacity disabled:opacity-40"
          style={{ background: 'var(--espresso)' }}
        >
          {t('add_btn')}
        </button>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative z-10 flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-full font-semibold text-[15px] transition-colors duration-200
        ${active ? 'text-ink' : 'text-faint hover:text-muted'}`}
      style={active ? { background: 'var(--card)', boxShadow: '0 1px 2px rgba(74,53,37,.06), 0 6px 16px -10px rgba(74,53,37,.3)' } : undefined}
    >
      <Icon name={icon} size={17} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function App() {
  const session = useSession();
  const [preLang, setPreLang] = useState(() => localStorage.getItem('ritual.lang') || 'tr');
  if (!CLOUD_READY) return <CloudMissing lang={preLang} />;
  if (session === undefined) return <div className="min-h-screen"></div>;
  if (session === null) return <AuthGate lang={preLang} onLang={() => { const n = preLang === 'tr' ? 'en' : 'tr'; setPreLang(n); localStorage.setItem('ritual.lang', n); }} />;
  return <Shell session={session} />;
}

function Shell({ session }) {
  const store = useStore();
  const sync = useCloudSync(store, session);
  const t = makeT(store.state.lang);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState(() => localStorage.getItem('ritual.view') || 'today');
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState(null);
  useEffect(() => { localStorage.setItem('ritual.view', view); }, [view]);
  useEffect(() => { applyTweaks(tweaks); }, [tweaks, store.state.theme]);
  useEffect(() => { localStorage.setItem('ritual.lang', store.state.lang); }, [store.state.lang]);

  return (
    <div className="min-h-screen safe-bottom">
      {/* Sticky navbar */}
      <div className="sticky top-0 z-40" style={{ background: 'linear-gradient(var(--bg) 70%, transparent)' }}>
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 safe-top pb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-cream rounded-full p-1 flex-1 sm:flex-none mr-auto">
              <NavButton icon="layers" label={t('nav_library')} active={view === 'library'} onClick={() => setView('library')} />
              <NavButton icon="list" label={t('nav_today')} active={view === 'today'} onClick={() => setView('today')} />
              <NavButton icon="grid" label={t('nav_matrix')} active={view === 'matrix'} onClick={() => setView('matrix')} />
              <NavButton icon="calendar" label={t('nav_insights')} active={view === 'insights'} onClick={() => setView('insights')} />
              <NavButton icon="settings" label={t('nav_settings')} active={view === 'settings'} onClick={() => setView('settings')} />
            </div>
            <SyncChip
              status={sync.status}
              email={session.user.email}
              onSignOut={() => sb.auth.signOut()}
              t={t}
            />
            <button
              onClick={() => store.setLang(store.state.lang === 'tr' ? 'en' : 'tr')}
              className="shrink-0 h-[52px] px-3.5 rounded-full bg-cream flex items-center gap-1.5 font-bold text-[13px] text-ink active:scale-95 transition-transform"
              aria-label="Türkçe / English"
              title="Türkçe / English"
            >
              <Icon name="globe" size={16} /> {store.state.lang.toUpperCase()}
            </button>
            <button
              onClick={() => setAdding(true)}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-cream shrink-0 transition-transform active:scale-95"
              style={{ background: 'var(--espresso)', boxShadow: '0 8px 20px -8px rgba(74,53,37,.6)' }}
              aria-label={t('add_aria')}
            >
              <Icon name="plus" size={24} stroke={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* Views */}
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-4">
        {view === 'library' && <LibraryView store={store} onOpen={setOpenId} />}
        {view === 'today' && <TodayView store={store} onOpen={setOpenId} timelinePos={tweaks.timelinePos} />}
        {view === 'matrix' && <MatrixView store={store} />}
        {view === 'insights' && <InsightsView store={store} />}
        {view === 'settings' && <SettingsView store={store} tweaks={tweaks} setTweak={setTweak} />}
      </div>

      {adding && <AddModal onClose={() => setAdding(false)} onAdd={store.addItem} t={t} />}
      {openId && <DetailDrawer store={store} itemId={openId} onClose={() => setOpenId(null)} />}
      <Toaster />
      <RitualTweaks t={tweaks} setTweak={setTweak} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
