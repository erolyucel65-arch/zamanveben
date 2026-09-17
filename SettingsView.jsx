function SettingRow({ icon, title, subtitle, danger, right, onClick, divider }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${onClick ? 'hover:bg-cream/50' : ''} ${divider ? 'border-t border-line' : ''}`}
    >
      <span className="shrink-0" style={{ color: danger ? 'var(--danger)' : 'var(--espresso)' }}>
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-bold text-[16px] ${danger ? '' : 'text-ink'}`} style={danger ? { color: 'var(--danger)' } : undefined}>{title}</p>
        {subtitle && <p className="text-faint text-[13px] font-medium mt-0.5">{subtitle}</p>}
      </div>
      {right !== undefined ? right : <Icon name="chevron" size={18} className="text-faint shrink-0" />}
    </Tag>
  );
}

function SectionLabel({ children }) {
  return <p className="text-faint text-[11px] font-bold tracking-[0.12em] px-1 mb-2.5 mt-7 first:mt-0">{children}</p>;
}

function SettingsView({ store, tweaks, setTweak }) {
  const { state, setTheme, setNotifications, importData, importRows, clearData } = store;
  const t = makeT(state.lang);
  const fileRef = useRefC(null);
  const xlsxRef = useRefC(null);

  // ── mapping helpers (app ↔ Excel template) ──────────────────
  const HZ_LABEL = { today: 'Bugün', week: 'Hafta', month: 'Ay', year: 'Yıl' };
  const EI_LABEL = { do: 'Yap', plan: 'Planla', delegate: 'Devret', drop: 'Bırak' };
  function hzFromText(v) {
    const s = (v == null ? '' : String(v)).trim().toLowerCase();
    if (!s) return null;
    if (s.includes('gün')) return 'today';
    if (s.includes('haft')) return 'week';
    if (s.includes('ay')) return 'month';
    if (s.includes('yıl') || s.includes('yil')) return 'year';
    return null;
  }
  function eiFromText(v) {
    const s = (v == null ? '' : String(v)).trim().toLowerCase();
    if (!s) return null;
    if (s.startsWith('yap')) return 'do';
    if (s.startsWith('plan')) return 'plan';
    if (s.startsWith('devret')) return 'delegate';
    if (s.startsWith('bırak') || s.startsWith('birak') || s.startsWith('ertele')) return 'drop';
    return null;
  }
  const REP_LABEL = { daily: 'Günlük', weekdays: 'Hafta içi', weekly: 'Haftalık', monthly: 'Aylık' };
  function repFromText(v) {
    const s = (v == null ? '' : String(v)).trim().toLowerCase();
    if (!s) return null;
    if (s.includes('hafta içi') || s.includes('hafta ici') || s.includes('weekday')) return 'weekdays';
    if (s.startsWith('gün') || s.startsWith('gun') || s.startsWith('dai') || s.startsWith('her gün')) return 'daily';
    if (s.startsWith('haft') || s.startsWith('week')) return 'weekly';
    if (s.startsWith('ay') || s.startsWith('month')) return 'monthly';
    return null;
  }
  function flagFromText(v) {
    const s = (v == null ? '' : String(v)).trim().toLowerCase();
    if (!s) return false;
    return /^(evet|var|x|✓|true|1|yes|önemli|onemli)$/.test(s);
  }
  const pad2 = n => String(n).padStart(2, '0');
  function toISODate(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date) return dateStr(v);
    const s = String(v).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : dateStr(d);
  }
  function toHM(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date) return pad2(v.getHours()) + ':' + pad2(v.getMinutes());
    if (typeof v === 'number') { const mins = Math.round((v % 1) * 24 * 60); return pad2(Math.floor(mins / 60) % 24) + ':' + pad2(mins % 60); }
    const m = String(v).trim().match(/^(\d{1,2}):(\d{2})/);
    return m ? pad2(+m[1]) + ':' + m[2] : null;
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `zamanveben-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { importData(JSON.parse(reader.result)); }
      catch (err) { alert(t('invalid_json')); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmClear() {
    if (confirm(t('clear_confirm'))) clearData();
  }

  // ── Excel export (two sheets matching the Timebooker template) ──
  function exportExcel() {
    if (!window.XLSX) { alert(t('excel_error')); return; }
    const catName = id => (state.categories.find(c => c.id === id) || {}).name || '';
    const nameById = id => (state.items.find(i => i.id === id) || {}).name || '';
    const build = (type, withParent) => {
      const head = withParent
        ? ['No', 'Tür', 'Kategori', 'Faaliyet', 'Zaman', 'Öncelik', 'Bağlı Faaliyet', 'Son Tarih', 'Saat', 'Hatırlatıcı', 'Tekrar', 'Önemli', 'Not', 'Süre']
        : ['No', 'Tür', 'Kategori', 'Faaliyet', 'Zaman', 'Öncelik', 'Son Tarih', 'Saat', 'Hatırlatıcı', 'Tekrar', 'Önemli', 'Not', 'Süre'];
      const tur = type === 'habit' ? 'Alışkanlıklar' : 'Görevler';
      const list = state.items.filter(i => i.type === type);
      const aoa = [head];
      list.forEach((it, idx) => {
        const base = [idx + 1, tur, catName(it.categoryId), it.name, it.horizon ? HZ_LABEL[it.horizon] : '', it.eisen ? EI_LABEL[it.eisen] : ''];
        if (withParent) base.push(it.parentId ? nameById(it.parentId) : '');
        base.push(it.due || '', it.dueTime || '', it.remind || '', it.repeat ? REP_LABEL[it.repeat] : '', it.flag ? 'Evet' : '', it.note || '', it.estimate || '');
        aoa.push(base);
      });
      return XLSX.utils.aoa_to_sheet(aoa);
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, build('habit', false), 'Alışkanlıklar');
    XLSX.utils.book_append_sheet(wb, build('task', true), 'Görevler');
    XLSX.writeFile(wb, `zamanveben-${today()}.xlsx`);
  }

  // ── Excel import (upsert: add missing categories + activities) ──
  function onImportExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.XLSX) { alert(t('excel_error')); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(reader.result), { type: 'array', cellDates: true });
        const rows = [];
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const grid = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
          if (!grid.length) return;
          const headers = grid[0].map(h => (h == null ? '' : String(h)).trim());
          const findIdx = re => headers.findIndex(h => re.test(h));
          const parentIdx = findIdx(/bağlı|bagli/i);
          const catIdx = findIdx(/kategori/i);
          const nameIdx = headers.findIndex((h, i) => /faaliyet/i.test(h) && i !== parentIdx);
          const priIdx = findIdx(/öncelik|oncelik/i);
          const turIdx = findIdx(/tür|tur/i);
          const dueIdx = findIdx(/son tarih|son_tarih|due/i);
          const timeIdx = headers.findIndex(h => /saat|time/i.test(h));
          const remindIdx = findIdx(/hatırlat|hatirlat|remind|alarm/i);
          const repeatIdx = findIdx(/tekrar|repeat/i);
          const flagIdx = findIdx(/önemli|onemli|important|star/i);
          const noteIdx = headers.findIndex(h => /^(not|note)$/i.test(String(h).trim()));
          const sureIdx = findIdx(/süre|sure/i);
          const zamanIdxs = headers.map((h, i) => (/^zaman$/i.test(String(h).trim()) ? i : -1)).filter(i => i >= 0);
          const horizonIdx = zamanIdxs.length ? zamanIdxs[0] : -1;
          const estimateIdx = sureIdx >= 0 ? sureIdx : (zamanIdxs.length > 1 ? zamanIdxs[zamanIdxs.length - 1] : -1);
          const sheetType = /alışkanlık|aliskanlik/i.test(sheetName) ? 'habit' : /görev|gorev/i.test(sheetName) ? 'task' : null;
          for (let r = 1; r < grid.length; r++) {
            const row = grid[r];
            const name = nameIdx >= 0 ? row[nameIdx] : null;
            if (name == null || !String(name).trim()) continue;
            let type = sheetType;
            if (!type && turIdx >= 0) type = /alışkanlık|aliskanlik/i.test(String(row[turIdx] || '')) ? 'habit' : 'task';
            if (!type) type = 'task';
            rows.push({
              type,
              category: catIdx >= 0 ? row[catIdx] : null,
              name,
              horizon: horizonIdx >= 0 ? hzFromText(row[horizonIdx]) : null,
              eisen: priIdx >= 0 ? eiFromText(row[priIdx]) : null,
              parent: parentIdx >= 0 ? row[parentIdx] : null,
              estimate: estimateIdx >= 0 && row[estimateIdx] != null ? String(row[estimateIdx]) : '',
              due: dueIdx >= 0 ? toISODate(row[dueIdx]) : null,
              dueTime: timeIdx >= 0 ? toHM(row[timeIdx]) : null,
              remind: remindIdx >= 0 ? toHM(row[remindIdx]) : null,
              repeat: repeatIdx >= 0 ? repFromText(row[repeatIdx]) : null,
              flag: flagIdx >= 0 ? flagFromText(row[flagIdx]) : false,
              note: noteIdx >= 0 && row[noteIdx] != null ? String(row[noteIdx]) : '',
            });
          }
        });
        // count what will actually be added (for feedback)
        const norm = x => (x == null ? '' : String(x)).trim().toLowerCase();
        const existCat = new Set(state.categories.map(c => c.type + '|' + norm(c.name)));
        const existItem = new Set(state.items.map(i => i.type + '|' + norm(i.name)));
        const newCats = new Set(), newItems = new Set();
        rows.forEach(r => {
          if (norm(r.category)) { const k = r.type + '|' + norm(r.category); if (!existCat.has(k) && !newCats.has(k)) newCats.add(k); }
          if (norm(r.name)) { const k = r.type + '|' + norm(r.name); if (!existItem.has(k) && !newItems.has(k)) newItems.add(k); }
        });
        importRows(rows);
        if (newCats.size === 0 && newItems.size === 0) alert(t('excel_none'));
        else alert(t('excel_added', newCats.size, newItems.size));
      } catch (err) {
        alert(t('excel_error'));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  const themeOpts = [
    { value: 'light', label: t('light'), icon: 'sun', dark: true },
    { value: 'dark', label: t('dark'), icon: 'moon', dark: true },
    { value: 'auto', label: t('auto'), icon: 'monitor', dark: true },
  ];

  return (
    <div className="fade-in max-w-[560px] mx-auto">
      <div className="mb-7">
        <p className="text-muted font-medium text-[15px]">{t('preferences')}</p>
        <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-[1.05] mt-1">{t('settings')}</h1>
      </div>

      <SectionLabel>{t('sec_account')}</SectionLabel>
      <Card className="overflow-hidden">
        <SettingRow icon="login" title={t('sign_in')} subtitle={t('sign_in_sub')} onClick={() => alert(t('sign_in_alert'))} />
      </Card>

      <SectionLabel>{t('sec_appearance')}</SectionLabel>
      <Segmented size="sm" value={state.theme} onChange={setTheme} options={themeOpts} />

      <SectionLabel>{t('sec_theme')}</SectionLabel>
      <Card className="p-5">
        <p className="text-faint text-[13px] font-bold mb-2.5">{t('tw_palette')}</p>
        <div className="flex gap-2.5 mb-5">
          {Object.entries(MOODS).map(([key, m]) => {
            const active = (tweaks?.mood || 'espresso') === key;
            return (
              <button
                key={key}
                onClick={() => setTweak('mood', key)}
                className="relative rounded-2xl overflow-hidden flex h-12 flex-1 transition-transform active:scale-95"
                style={{ outline: active ? '2.5px solid var(--ink)' : '1px solid var(--line)', outlineOffset: active ? '2px' : '0' }}
                aria-label={key}
                aria-pressed={active}
              >
                {m.swatch.map((c, i) => <span key={i} className="flex-1 h-full" style={{ background: c }} />)}
                {active && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,.35)' }}>
                      <Icon name="check" size={15} stroke={3} className="text-white" />
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-faint text-[13px] font-bold mb-2.5">{t('tw_softness')}</p>
        <div className="mb-5">
          <Segmented
            size="sm"
            value={tweaks?.softness || 'balanced'}
            onChange={v => setTweak('softness', v)}
            options={[{ value: 'sharp', label: t('soft_sharp') }, { value: 'balanced', label: t('soft_balanced') }, { value: 'pillowy', label: t('soft_pillowy') }]}
          />
        </div>
        <p className="text-faint text-[13px] font-bold mb-2.5">{t('tw_typeface')}</p>
        <Segmented
          size="sm"
          value={tweaks?.typeface || 'modern'}
          onChange={v => setTweak('typeface', v)}
          options={[{ value: 'modern', label: t('type_modern') }, { value: 'rounded', label: t('type_rounded') }, { value: 'editorial', label: t('type_editorial') }]}
        />
      </Card>

      <SectionLabel>{t('tl_section')}</SectionLabel>
      <Card className="p-5">
        <p className="text-faint text-[13px] font-bold mb-2.5">{t('tl_position')}</p>
        <Segmented
          size="sm"
          value={tweaks?.timelinePos || 'bottom'}
          onChange={v => setTweak('timelinePos', v)}
          options={[{ value: 'bottom', label: t('tl_bottom') }, { value: 'right', label: t('tl_right') }, { value: 'left', label: t('tl_left') }]}
        />
        <p className="text-faint text-[12.5px] font-medium mt-3">{t('tl_hint')}</p>
      </Card>

      <SectionLabel>{t('sec_notif')}</SectionLabel>
      <Card className="overflow-hidden">
        <SettingRow
          icon="bell"
          title={t('notif_title')}
          subtitle={t('notif_sub')}
          right={<Switch on={state.notifications} onChange={setNotifications} />}
        />
      </Card>

      <SectionLabel>{t('sec_data')}</SectionLabel>
      <Card className="overflow-hidden">
        <SettingRow icon="download" title={t('export_excel')} subtitle={t('export_excel_sub')} onClick={exportExcel} />
        <SettingRow icon="upload" title={t('import_excel')} subtitle={t('import_excel_sub')} divider onClick={() => xlsxRef.current?.click()} />
        <SettingRow icon="download" title={t('export')} subtitle={t('export_sub')} divider onClick={exportData} />
        <SettingRow icon="upload" title={t('import')} subtitle={t('import_sub')} divider onClick={() => fileRef.current?.click()} />
        <SettingRow icon="trash" title={t('clear')} subtitle={t('clear_sub')} danger divider onClick={confirmClear} />
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
        <input ref={xlsxRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={onImportExcel} />
      </Card>

      <SectionLabel>{t('sec_about')}</SectionLabel>
      <Card className="px-5 py-4">
        <p className="font-bold text-[16px]">{t('app_name')}</p>
        <p className="text-faint text-[13px] font-medium mt-0.5">{t('about_sub')}</p>
      </Card>
      <div className="h-10" />
    </div>
  );
}

window.SettingsView = SettingsView;
