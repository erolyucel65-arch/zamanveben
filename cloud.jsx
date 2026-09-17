// Bulut katmanı: Supabase oturumu + tüm uygulama durumunun tek satırda senkronu.
// Yerel localStorage çalışma kopyası olarak kalır; bulut son-yazan-kazanır ile eşitlenir.
const CLOUD_READY = !!(window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'PASTE_ANON_KEY_HERE' && window.supabase);
const sb = CLOUD_READY ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
const DIRTY_KEY = 'zvb.dirtyAt';

function useSession() {
  const [session, setSession] = React.useState(undefined); // undefined = yükleniyor
  React.useEffect(() => {
    if (!sb) { setSession(null); return; }
    sb.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s || null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

// 'idle' | 'pulling' | 'saving' | 'synced' | 'offline' | 'error'
function useCloudSync(store, session) {
  const [status, setStatus] = React.useState('idle');
  const applying = React.useRef(false);
  const primed = React.useRef(false);
  const timer = React.useRef(null);
  const uid = session?.user?.id;

  const pull = React.useCallback(async (force) => {
    if (!sb || !uid) return;
    setStatus('pulling');
    const { data, error } = await sb.from('app_state').select('data,updated_at').eq('user_id', uid).maybeSingle();
    if (error) { setStatus('error'); console.warn('[cloud] pull', error.message); return; }
    const dirtyAt = Number(localStorage.getItem(DIRTY_KEY) || 0);
    const remoteAt = data ? new Date(data.updated_at).getTime() : 0;
    if (!data || (!force && dirtyAt > remoteAt)) {
      // Bulutta kayıt yok ya da yerel kopya daha yeni → yerelden yükle
      await push(store.state);
      return;
    }
    if (data.data && Object.keys(data.data).length) {
      applying.current = true;
      store.importData(data.data);
      setTimeout(() => { applying.current = false; }, 0);
    }
    localStorage.setItem(DIRTY_KEY, String(remoteAt));
    setStatus('synced');
  }, [uid, store.state]);

  async function push(payload) {
    if (!sb || !uid) return;
    setStatus('saving');
    const { error } = await sb.from('app_state').upsert({ user_id: uid, data: payload }, { onConflict: 'user_id' });
    if (error) { setStatus(navigator.onLine ? 'error' : 'offline'); console.warn('[cloud] push', error.message); return; }
    localStorage.setItem(DIRTY_KEY, String(Date.now()));
    setStatus('synced');
  }

  // Oturum açıldığında ilk çekme
  React.useEffect(() => {
    if (!uid) { primed.current = false; setStatus('idle'); return; }
    primed.current = false;
    pull().then(() => { primed.current = true; });
  }, [uid]);

  // Her değişiklikte gecikmeli yazma
  React.useEffect(() => {
    if (!uid || !primed.current || applying.current) return;
    localStorage.setItem(DIRTY_KEY, String(Date.now()));
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(store.state), 1200);
    return () => clearTimeout(timer.current);
  }, [store.state, uid]);

  // Sekmeye dönüldüğünde diğer cihazın değişikliğini al
  React.useEffect(() => {
    if (!uid) return;
    const onVis = () => { if (document.visibilityState === 'visible' && primed.current) pull(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [uid, pull]);

  return { status, pullNow: () => pull(true), pushNow: () => push(store.state) };
}

function SyncChip({ status, email, onSignOut, t }) {
  const [open, setOpen] = React.useState(false);
  const label = { pulling: t('sync_pulling'), saving: t('sync_saving'), synced: t('sync_synced'), offline: t('sync_offline'), error: t('sync_error'), idle: '' }[status] || '';
  const dot = { synced: 'var(--done-edge)', saving: 'var(--accent)', pulling: 'var(--accent)', offline: 'var(--faint)', error: 'var(--danger)' }[status] || 'var(--faint)';
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="h-[52px] px-3.5 rounded-full bg-cream flex items-center gap-2 font-bold text-[13px] text-ink active:scale-95 transition-transform"
        title={email}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }}></span>
        <span className="hidden sm:inline max-w-[120px] truncate">{email}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-[58px] z-50 bg-card rounded-3xl shadow-lift p-2 min-w-[220px] pop">
            <div className="px-3 py-2">
              <div className="font-bold text-[14px] truncate">{email}</div>
              <div className="text-[12px] text-muted">{label || t('sync_idle')}</div>
            </div>
            <button onClick={() => { setOpen(false); onSignOut(); }} className="w-full text-left px-3 py-2.5 rounded-2xl font-semibold text-[14px] text-danger hover:bg-cream">
              {t('sign_out')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { sb, CLOUD_READY, useSession, useCloudSync, SyncChip });
