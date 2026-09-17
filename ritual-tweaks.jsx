// Ritual — expressive tweak definitions + appliers.
// Three holistic levers: Mood (full palette), Softness (radius+shadow), Typeface.

// Each mood overrides the app's CSS theme vars for BOTH light & dark, so it
// composes with the existing light/dark/auto theme system.
const MOODS = {
  espresso: {
    swatch: ['#4A3525', '#F0A227', '#F4EDE2'],
    light: { bg: '#FDFBF7', card: '#FFFFFF', cream: '#F4EDE2', ink: '#2A211B', muted: '#8C8076', faint: '#B7ADA2', espresso: '#4A3525', accent: '#F0A227', line: 'rgba(74,53,37,0.09)' },
    dark:  { bg: '#17120E', card: '#221C16', cream: '#2A231C', ink: '#F2EAE0', muted: '#9C9085', faint: '#6E6358', espresso: '#C8A079', accent: '#F0A227', line: 'rgba(255,247,237,0.08)' },
  },
  sage: {
    swatch: ['#2E4A38', '#6FAE84', '#E7EFE5'],
    light: { bg: '#F7FAF6', card: '#FFFFFF', cream: '#E7EFE5', ink: '#1E261F', muted: '#76817A', faint: '#A6B2AB', espresso: '#2E4A38', accent: '#5C9E78', line: 'rgba(46,74,56,0.10)' },
    dark:  { bg: '#10140F', card: '#1A201A', cream: '#232C24', ink: '#E8EFE6', muted: '#8A958C', faint: '#5E665F', espresso: '#9CC4A8', accent: '#6FAE84', line: 'rgba(240,247,237,0.08)' },
  },
  dusk: {
    swatch: ['#4A2E45', '#C77DA3', '#F1E7EE'],
    light: { bg: '#FBF8FA', card: '#FFFFFF', cream: '#F1E7EE', ink: '#261E24', muted: '#877E84', faint: '#B5AAB2', espresso: '#4A2E45', accent: '#B86A97', line: 'rgba(74,46,69,0.10)' },
    dark:  { bg: '#150F14', card: '#201A1E', cream: '#2B232A', ink: '#EFE6EC', muted: '#978A92', faint: '#665E63', espresso: '#C39CB8', accent: '#C77DA3', line: 'rgba(247,237,244,0.08)' },
  },
  slate: {
    swatch: ['#2B3340', '#3E7BD6', '#E9ECF1'],
    light: { bg: '#F8F9FB', card: '#FFFFFF', cream: '#E9ECF1', ink: '#1B1F26', muted: '#79808C', faint: '#A8AFBB', espresso: '#2B3340', accent: '#3E7BD6', line: 'rgba(43,51,64,0.10)' },
    dark:  { bg: '#0F1115', card: '#191D23', cream: '#232831', ink: '#E8ECF2', muted: '#899099', faint: '#5D636C', espresso: '#A9BBD4', accent: '#5E92E0', line: 'rgba(237,242,248,0.08)' },
  },
};

const SOFTNESS = {
  sharp:    { rad: 0.4, soft: '0 1px 2px rgba(20,16,12,0.06)', lift: '0 2px 6px rgba(20,16,12,0.12)' },
  balanced: { rad: 1.0, soft: '0 1px 2px rgba(74,53,37,0.04), 0 8px 24px -12px rgba(74,53,37,0.12)', lift: '0 2px 4px rgba(74,53,37,0.05), 0 18px 40px -18px rgba(74,53,37,0.22)' },
  pillowy:  { rad: 1.7, soft: '0 2px 6px rgba(74,53,37,0.05), 0 16px 40px -14px rgba(74,53,37,0.20)', lift: '0 4px 10px rgba(74,53,37,0.07), 0 30px 60px -20px rgba(74,53,37,0.32)' },
};

const TYPEFACES = {
  modern:    '"Plus Jakarta Sans", system-ui, sans-serif',
  rounded:   '"Nunito", system-ui, sans-serif',
  editorial: '"Spectral", Georgia, serif',
};

// Build one stylesheet that layers all three tweaks on top of the base theme.
function buildTweakCSS(t) {
  const mood = MOODS[t.mood] || MOODS.espresso;
  const soft = SOFTNESS[t.softness] || SOFTNESS.balanced;
  const font = TYPEFACES[t.typeface] || TYPEFACES.modern;
  const vars = o => Object.entries(o).map(([k, v]) => `--${k}:${v};`).join('');

  const RAD = { md: 0.375, lg: 0.5, xl: 0.75, '2xl': 1, '3xl': 1.5, '4xl': 1.75, '5xl': 2.25 };
  const radRules = Object.entries(RAD)
    .map(([cls, rem]) => `:root[data-feel] .rounded-${cls}{border-radius:calc(${rem}rem * var(--rad));}`)
    .join('\n');

  return `
:root[data-theme="light"]{${vars(mood.light)}}
:root[data-theme="dark"]{${vars(mood.dark)}}
:root[data-feel]{--rad:${soft.rad};}
${radRules}
:root[data-feel] .shadow-soft{box-shadow:${soft.soft};}
:root[data-feel] .shadow-lift{box-shadow:${soft.lift};}
:root[data-feel] body,
:root[data-feel] input,
:root[data-feel] button,
:root[data-feel] select,
:root[data-feel] textarea{font-family:${font};}
`;
}

function applyTweaks(t) {
  document.documentElement.setAttribute('data-feel', '');
  let el = document.getElementById('tweak-overrides');
  if (!el) {
    el = document.createElement('style');
    el.id = 'tweak-overrides';
    document.head.appendChild(el);
  }
  el.textContent = buildTweakCSS(t);
}

Object.assign(window, { MOODS, SOFTNESS, TYPEFACES, applyTweaks });
