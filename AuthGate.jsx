// Giriş / kayıt ekranı. Oturum yoksa uygulamanın önünde durur.
function AuthGate({ lang, onLang }) {
  const t = makeT(lang);
  const [mode, setMode] = React.useState('in'); // 'in' | 'up' | 'reset'
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null); // { kind:'err'|'ok', text }

  async function submit(e) {
    e?.preventDefault();
    if (!email.trim() || (mode !== 'reset' && pw.length < 6)) return;
    setBusy(true); setMsg(null);
    try {
      if (mode === 'in') {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
      } else if (mode === 'up') {
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password: pw });
        if (error) throw error;
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          // Supabase kayıtlı e-postayı sızdırmamak için başarılı gibi döner, mail göndermez
          setMode('in');
          setMsg({ kind: 'ok', text: t('auth_exists') });
        } else if (!data.session) setMsg({ kind: 'ok', text: t('auth_confirm_sent') });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.href });
        if (error) throw error;
        setMsg({ kind: 'ok', text: t('auth_reset_sent') });
      }
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || t('auth_error') });
    } finally { setBusy(false); }
  }

  const title = mode === 'in' ? t('auth_in_title') : mode === 'up' ? t('auth_up_title') : t('auth_reset_title');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--espresso)', color: 'var(--card)' }}>
              <Icon name="check" size={22} stroke={2.6} />
            </div>
            <div>
              <div className="font-extrabold text-[18px] leading-tight">ZamanVeBen</div>
              <div className="text-[13px] text-muted leading-tight">{t('auth_tagline')}</div>
            </div>
          </div>
          <button onClick={onLang} className="h-9 px-3 rounded-full bg-cream font-bold text-[12px] text-ink shrink-0">{lang.toUpperCase()}</button>
        </div>

        <div className="bg-card rounded-4xl shadow-soft p-6">
          <h1 className="text-[22px] font-extrabold mb-1">{title}</h1>
          <p className="text-[14px] text-muted mb-5" style={{ textWrap: 'pretty' }}>{mode === 'reset' ? t('auth_reset_sub') : t('auth_sub')}</p>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t('auth_email')}
              className="w-full bg-cream rounded-2xl px-4 py-3.5 font-semibold text-ink placeholder:text-faint border border-transparent focus:border-espresso/30 outline-none"
            />
            {mode !== 'reset' && (
              <input
                type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required minLength={6}
                value={pw} onChange={e => setPw(e.target.value)} placeholder={t('auth_pw')}
                className="w-full bg-cream rounded-2xl px-4 py-3.5 font-semibold text-ink placeholder:text-faint border border-transparent focus:border-espresso/30 outline-none"
              />
            )}
            {msg && (
              <div className="text-[13px] font-semibold rounded-2xl px-4 py-3" style={msg.kind === 'err' ? { background: 'color-mix(in oklch, var(--danger) 12%, var(--card))', color: 'var(--danger)' } : { background: 'var(--done-bg)', color: 'var(--ink)' }}>
                {msg.text}
              </div>
            )}
            <button
              type="submit" disabled={busy}
              className="w-full py-3.5 rounded-2xl font-bold text-cream transition-opacity disabled:opacity-40"
              style={{ background: 'var(--espresso)' }}
            >
              {busy ? '…' : mode === 'in' ? t('auth_in_btn') : mode === 'up' ? t('auth_up_btn') : t('auth_reset_btn')}
            </button>
          </form>

          <div className="flex flex-col gap-1 mt-5 pt-5" style={{ borderTop: '1px solid var(--line)' }}>
            {mode !== 'in' && <button onClick={() => { setMode('in'); setMsg(null); }} className="text-left text-[14px] font-semibold text-muted hover:text-ink py-1">{t('auth_have')}</button>}
            {mode !== 'up' && <button onClick={() => { setMode('up'); setMsg(null); }} className="text-left text-[14px] font-semibold text-muted hover:text-ink py-1">{t('auth_new')}</button>}
            {mode !== 'reset' && <button onClick={() => { setMode('reset'); setMsg(null); }} className="text-left text-[14px] font-semibold text-muted hover:text-ink py-1">{t('auth_forgot')}</button>}
          </div>
        </div>

        <p className="text-[12px] text-faint mt-5 px-2" style={{ textWrap: 'pretty' }}>{t('auth_privacy')}</p>
      </div>
    </div>
  );
}

// Şifre sıfırlama bağlantısıyla gelindiğinde yeni şifreyi burada belirler
function SetPassword({ lang, onDone }) {
  const t = makeT(lang);
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);

  async function submit(e) {
    e?.preventDefault();
    if (pw.length < 6) { setErr(t('auth_pw_short')); return; }
    if (pw !== pw2) { setErr(t('auth_pw_match')); return; }
    setBusy(true); setErr(null);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    history.replaceState(null, '', location.pathname);
    onDone();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="bg-card rounded-4xl shadow-soft p-6">
          <h1 className="text-[22px] font-extrabold mb-1">{t('auth_set_title')}</h1>
          <p className="text-[14px] text-muted mb-5" style={{ textWrap: 'pretty' }}>{t('auth_set_sub')}</p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input type="password" autoComplete="new-password" autoFocus value={pw} onChange={e => setPw(e.target.value)} placeholder={t('auth_pw')}
              className="w-full bg-cream rounded-2xl px-4 py-3.5 font-semibold text-ink placeholder:text-faint border border-transparent focus:border-espresso/30 outline-none" />
            <input type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder={t('auth_pw_again')}
              className="w-full bg-cream rounded-2xl px-4 py-3.5 font-semibold text-ink placeholder:text-faint border border-transparent focus:border-espresso/30 outline-none" />
            {err && <div className="text-[13px] font-semibold rounded-2xl px-4 py-3" style={{ background: 'color-mix(in oklch, var(--danger) 12%, var(--card))', color: 'var(--danger)' }}>{err}</div>}
            <button type="submit" disabled={busy} className="w-full py-3.5 rounded-2xl font-bold text-cream transition-opacity disabled:opacity-40" style={{ background: 'var(--espresso)' }}>
              {busy ? '…' : t('auth_set_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CloudMissing({ lang }) {
  const t = makeT(lang);
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="bg-card rounded-4xl shadow-soft p-6 max-w-[420px]">
        <h1 className="text-[20px] font-extrabold mb-2">{t('cloud_missing_title')}</h1>
        <p className="text-[14px] text-muted" style={{ textWrap: 'pretty' }}>{t('cloud_missing_sub')}</p>
      </div>
    </div>
  );
}

Object.assign(window, { AuthGate, SetPassword, CloudMissing });
