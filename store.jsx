// ── Date helpers ────────────────────────────────────────────────
function dateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function today() { return dateStr(new Date()); }
function addDays(base, n) { const d = new Date(base); d.setDate(d.getDate() + n); return d; }
function mondayIndex(d) { return (d.getDay() + 6) % 7; } // Mon=0 … Sun=6

// ── Default seed (matches reference: two habits, empty history) ──
function defaultState() {
  return {
    categories: [
      { id: 'c1', name: 'Öğrenme', type: 'habit', color: '#F0A227' },
      { id: 'c2', name: 'Sağlık', type: 'habit', color: '#6FB257' },
      { id: 'c3', name: 'İş', type: 'task', color: '#3E7BD6' },
    ],
    items: [
      { id: 'h1', name: 'Duolingo', color: '#F0A227', type: 'habit', horizon: 'today', categoryId: 'c1' },
      { id: 'h2', name: 'Konuşma Pratiği', color: '#E8862A', type: 'habit', horizon: 'today', categoryId: 'c1' },
    ],
    blocks: [],                       // { id, itemId, startMin, duration, date }
    assignments: [],                  // { id, itemId, key }  key = 'YYYY-MM-DD' (week/month) | 'YYYY-MM' (year)
    completions: {},                  // { itemId: { 'YYYY-MM-DD': time } }
    theme: 'light',
    notifications: false,
    lang: 'tr',
  };
}

const STORAGE_KEY = 'ritual.app.v2';
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const merged = { ...defaultState(), ...p };
      merged.categories = merged.categories || [];
      merged.assignments = merged.assignments || [];
      merged.categories = merged.categories.map(c => ({ ...c, color: c.color || null }));
      merged.items = (merged.items || []).map(i => ({
        ...i,
        horizon: i.horizon === undefined ? 'today' : i.horizon,
        categoryId: i.categoryId === undefined ? null : i.categoryId,
        parentId: i.parentId === undefined ? null : i.parentId,
        eisen: i.eisen === undefined ? null : i.eisen,
        note: i.note === undefined ? '' : i.note,
        due: i.due === undefined ? null : i.due,
        remind: i.remind === undefined ? null : i.remind,
        repeat: i.repeat === undefined ? null : i.repeat,
        flag: i.flag === undefined ? false : i.flag,
        myDay: i.myDay === undefined ? null : i.myDay,
        dueTime: i.dueTime === undefined ? null : i.dueTime,
        estimate: i.estimate === undefined ? null : i.estimate,
      }));
      return merged;
    }
  } catch (e) { /* ignore */ }
  return defaultState();
}

// ── Stats ───────────────────────────────────────────────────────
function computeStats(completions, itemId) {
  const map = completions[itemId] || {};
  const done = Object.keys(map).filter(k => map[k]).sort();

  // current streak: count back from today; ignore today if not yet done
  let current = 0;
  let cursor = new Date();
  if (!map[dateStr(cursor)]) cursor = addDays(cursor, -1);
  while (map[dateStr(cursor)]) { current++; cursor = addDays(cursor, -1); }

  // best streak across all completed days
  let best = 0, run = 0, prev = null;
  for (const s of done) {
    if (prev && dateStr(addDays(new Date(prev), 1)) === s) run++; else run = 1;
    best = Math.max(best, run); prev = s;
  }

  // 30-day completion rate
  let last30 = 0;
  for (let i = 0; i < 30; i++) if (map[dateStr(addDays(new Date(), -i))]) last30++;
  const rate = Math.round((last30 / 30) * 100);

  return { current, best, rate, total: done.length };
}

// last 30 days as cells aligned to weekday columns (Mon→Sun)
function gridCells() {
  const start = addDays(new Date(), -29);
  const lead = mondayIndex(start);
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let i = 0; i < 30; i++) cells.push(dateStr(addDays(start, i)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ── Store hook ──────────────────────────────────────────────────
function useStore() {
  const [state, setState] = React.useState(loadState);
  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  // apply theme to <html>
  React.useEffect(() => {
    const apply = () => {
      let t = state.theme;
      if (t === 'auto') t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
    };
    apply();
    if (state.theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [state.theme]);

  // ── Reminder engine: fire a notification when an item's remind time
  //    matches now (only items in My Day today or due today). ──
  React.useEffect(() => {
    if (!state.notifications) return;
    const tick = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const td = today();
      state.items.forEach(it => {
        if (it.remind !== hm) return;
        if (it.myDay !== td && it.due !== td) return;
        const key = `ritual.notified.${it.id}.${td}.${hm}`;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
        const appName = state.lang === 'tr' ? 'ZamanVeBen' : 'TimeAndMe';
        try { new Notification(it.name, { body: it.type === 'habit' ? `${appName} — alışkanlık zamanı` : `${appName} — görev hatırlatması`, tag: it.id }); } catch (e) {}
      });
    };
    tick();
    const iv = setInterval(tick, 30000);
    return () => clearInterval(iv);
  }, [state.notifications, state.items]);

  const actions = React.useMemo(() => ({
    addItem(name, type, horizon = 'today', categoryId = null, parentId = null) {
      const palette = ['#F0A227', '#E8862A', '#C98A3E', '#A8742E'];
      setState(s => {
        const cat = s.categories.find(c => c.id === categoryId);
        return {
        ...s,
        items: [...s.items, {
          id: 'i' + Date.now() + Math.random().toString(36).slice(2, 5),
          name: name.trim(), type, horizon, categoryId, parentId, eisen: null,
          note: '', due: null, dueTime: null, remind: null, repeat: null, flag: false, myDay: null,
          color: (cat && cat.color) || palette[s.items.length % palette.length],
        }],
        };
      });
    },
    setNote(itemId, note) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, note } : i) }));
    },
    setDue(itemId, due) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, due, dueTime: due ? i.dueTime : null } : i) }));
    },
    setDueTime(itemId, dueTime) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, dueTime } : i) }));
    },
    // reorder within "my order": drop dragId at targetId's position (adopts its category)
    reorderItems(dragId, targetId) {
      setState(s => {
        if (dragId === targetId) return s;
        const items = [...s.items];
        const from = items.findIndex(i => i.id === dragId);
        const t = items.find(i => i.id === targetId);
        if (from < 0 || !t) return s;
        const moved = { ...items[from], categoryId: t.categoryId };
        items.splice(from, 1);
        const to = items.findIndex(i => i.id === targetId);
        items.splice(to, 0, moved);
        return { ...s, items };
      });
    },
    setEstimate(itemId, estimate) {
      setState(st => ({ ...st, items: st.items.map(i => i.id === itemId ? { ...i, estimate } : i) }));
    },
    setRemind(itemId, remind) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, remind } : i) }));
    },
    setRepeat(itemId, repeat) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, repeat } : i) }));
    },
    toggleFlag(itemId) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, flag: !i.flag } : i) }));
    },
    toggleMyDay(itemId) {
      const td = today();
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, myDay: i.myDay === td ? null : td } : i) }));
    },
    setEisen(itemId, eisen) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, eisen } : i) }));
    },
    addCategory(name, type, color = null) {
      setState(s => ({ ...s, categories: [...s.categories, { id: 'c' + Date.now(), name: name.trim(), type, color }] }));
    },
    setCategoryColor(id, color) {
      setState(s => ({
        ...s,
        categories: s.categories.map(c => c.id === id ? { ...c, color } : c),
        items: color ? s.items.map(i => i.categoryId === id ? { ...i, color } : i) : s.items,
      }));
    },
    renameCategory(id, name) {
      setState(s => ({ ...s, categories: s.categories.map(c => c.id === id ? { ...c, name } : c) }));
    },
    removeCategory(id) {
      setState(s => ({
        ...s,
        categories: s.categories.filter(c => c.id !== id),
        items: s.items.map(i => i.categoryId === id ? { ...i, categoryId: null } : i),
      }));
    },
    setItemCategory(itemId, categoryId) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, categoryId } : i) }));
    },
    // move an item and its whole subtree (subtasks) to another category
    moveItemCategory(itemId, categoryId) {
      setState(s => {
        const kin = new Set([itemId]);
        let changed = true;
        while (changed) {
          changed = false;
          s.items.forEach(i => { if (i.parentId && kin.has(i.parentId) && !kin.has(i.id)) { kin.add(i.id); changed = true; } });
        }
        return { ...s, items: s.items.map(i => kin.has(i.id) ? { ...i, categoryId } : i) };
      });
    },
    setHorizon(itemId, horizon) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, horizon } : i) }));
    },
    renameItem(itemId, name) {
      setState(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, name } : i) }));
    },
    removeItem(id) {
      setState(s => {
        // collect the item and all its descendants (task tree)
        const kill = new Set([id]);
        let changed = true;
        while (changed) {
          changed = false;
          s.items.forEach(i => {
            if (i.parentId && kill.has(i.parentId) && !kill.has(i.id)) { kill.add(i.id); changed = true; }
          });
        }
        const trashComp = {};
        const completions = { ...s.completions };
        kill.forEach(rid => { if (s.completions[rid]) trashComp[rid] = s.completions[rid]; delete completions[rid]; });
        return {
          ...s,
          items: s.items.filter(i => !kill.has(i.id)),
          blocks: s.blocks.filter(b => !kill.has(b.itemId)),
          assignments: (s.assignments || []).filter(a => !kill.has(a.itemId)),
          completions,
          _trash: {
            items: s.items.filter(i => kill.has(i.id)),
            blocks: s.blocks.filter(b => kill.has(b.itemId)),
            assignments: (s.assignments || []).filter(a => kill.has(a.itemId)),
            completions: trashComp,
          },
        };
      });
    },
    undoRemove() {
      setState(s => {
        const tr = s._trash;
        if (!tr) return s;
        return {
          ...s,
          items: [...s.items, ...tr.items],
          blocks: [...s.blocks, ...tr.blocks],
          assignments: [...(s.assignments || []), ...tr.assignments],
          completions: { ...s.completions, ...tr.completions },
          _trash: null,
        };
      });
    },
    toggleComplete(itemId, date) {
      setState(s => {
        const m = { ...(s.completions[itemId] || {}) };
        if (m[date]) delete m[date];
        else {
          const n = new Date();
          m[date] = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
        }
        return { ...s, completions: { ...s.completions, [itemId]: m } };
      });
    },
    addBlock(itemId, startMin, duration, date) {
      setState(s => ({ ...s, blocks: [...s.blocks, { id: 'b' + Date.now() + Math.random().toString(36).slice(2, 6), itemId, startMin, duration, date }] }));
    },
    moveBlock(id, startMin) {
      setState(s => ({ ...s, blocks: s.blocks.map(b => b.id === id ? { ...b, startMin } : b) }));
    },
    removeBlock(id) {
      setState(s => ({ ...s, blocks: s.blocks.filter(b => b.id !== id) }));
    },
    addAssignment(itemId, key) {
      setState(s => ({ ...s, assignments: [...s.assignments, { id: 'a' + Date.now() + Math.random().toString(36).slice(2, 5), itemId, key }] }));
    },
    removeAssignment(id) {
      setState(s => ({ ...s, assignments: s.assignments.filter(a => a.id !== id) }));
    },
    setTheme(theme) { setState(s => ({ ...s, theme })); },
    setLang(lang) { setState(s => ({ ...s, lang })); },
    setNotifications(on) {
      if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        try { Notification.requestPermission(); } catch (e) {}
      }
      setState(s => ({ ...s, notifications: on }));
    },
    importData(obj) { setState(s => ({ ...defaultState(), ...obj })); },
    // Excel-style upsert: add categories/items that don't already exist (matched by name+type).
    // Existing items are left untouched. `rows` = [{ type, category, name, horizon, eisen, parent, estimate }]
    importRows(rows) {
      setState(s => {
        const categories = s.categories.map(c => ({ ...c }));
        const items = s.items.map(i => ({ ...i }));
        const norm = x => (x == null ? '' : String(x)).trim().toLowerCase();
        const findCat = (name, type) => categories.find(c => c.type === type && norm(c.name) === norm(name));
        const findItem = (name, type) => items.find(i => i.type === type && norm(i.name) === norm(name));
        const palette = ['#F0A227', '#E8862A', '#C98A3E', '#A8742E'];
        let seq = 0;
        const uid = p => p + Date.now().toString(36) + (seq++).toString(36);
        const created = [];
        for (const r of rows) {
          if (!norm(r.name)) continue;
          let catId = null;
          if (norm(r.category)) {
            let cat = findCat(r.category, r.type);
            if (!cat) { cat = { id: uid('c'), name: String(r.category).trim(), type: r.type }; categories.push(cat); }
            catId = cat.id;
          }
          if (findItem(r.name, r.type)) continue; // already exists → skip
          const it = {
            id: uid('i'), name: String(r.name).trim(), type: r.type,
            horizon: r.horizon === undefined ? 'today' : r.horizon,
            categoryId: catId, parentId: null,
            eisen: r.eisen == null ? null : r.eisen,
            due: r.due || null, dueTime: r.dueTime || null, remind: r.remind || null,
            repeat: r.repeat || null, flag: !!r.flag, note: r.note || '', myDay: null,
            color: (catId && (categories.find(c => c.id === catId) || {}).color) || palette[items.length % palette.length],
          };
          if (r.estimate) it.estimate = String(r.estimate);
          items.push(it);
          created.push({ it, parent: r.parent });
        }
        // link parents (by name, same type) for newly created rows
        for (const { it, parent } of created) {
          if (!norm(parent)) continue;
          const par = findItem(parent, it.type);
          if (par && par.id !== it.id) it.parentId = par.id;
        }
        return { ...s, categories, items };
      });
    },
    clearData() { setState(defaultState()); },
  }), []);

  return { state, ...actions };
}

// ── Eisenhower quadrants + archive helper ───────────────────────
const EISEN = {
  do:       { color: '#C0492F' }, // urgent + important
  plan:     { color: '#2F8F6B' }, // important, not urgent
  delegate: { color: '#E0922A' }, // urgent, not important
  drop:     { color: '#8C8076' }, // neither
};
// A task is "archived to Insights" once it has any completion.
function isArchived(state, id) {
  const it = state.items.find(i => i.id === id);
  if (!it || it.type !== 'task') return false;
  const m = state.completions[id] || {};
  return Object.keys(m).some(k => m[k]);
}

// Has this item ever been completed (any date)?
function isDone(state, id) {
  const m = state.completions[id] || {};
  return Object.keys(m).some(k => m[k]);
}

// Sub-step progress for a parent task → { done, total } | null
function stepsProgress(state, id) {
  const kids = state.items.filter(i => i.parentId === id);
  if (!kids.length) return null;
  const done = kids.filter(k => isDone(state, k.id)).length;
  return { done, total: kids.length };
}

// Curated per-category accents — shared hue family, works across all moods.
const CAT_PALETTE = ['#F0A227', '#6FB257', '#3E7BD6', '#C77DA3', '#E8862A', '#9A7BD0', '#4BA3A0', '#C0492F'];

// Human-readable repeat label
function repeatLabel(t, r) {
  if (!r) return t('rep_none');
  return t('rep_' + r);
}

Object.assign(window, { dateStr, today, addDays, mondayIndex, computeStats, gridCells, useStore, EISEN, isArchived, isDone, stepsProgress, CAT_PALETTE, repeatLabel });
