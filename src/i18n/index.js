// i18n runtime — load a locale, look up keys with {var} substitution.
//
// API:
//   loadLocale(lang)            — switch active language ('zh' or 'en')
//   t(key, vars)                — translate, with {var} interpolation
//   getCurrentLocale()          — return 'zh' or 'en'
//   getAllKeys()                — return a flat { key: translation } for the
//                                  current locale; used by the Web UI to embed
//                                  its dictionary in one place.

const zh = require('./zh.json');
const en = require('./en.json');

const LOCALES = { zh, en };
let current = process.env.JUAN_SCHEDULE_LANG && LOCALES[process.env.JUAN_SCHEDULE_LANG]
  ? process.env.JUAN_SCHEDULE_LANG
  : 'zh';

function loadLocale(lang) {
  if (LOCALES[lang]) {
    current = lang;
    return true;
  }
  return false;
}

function getCurrentLocale() {
  return current;
}

function t(key, vars) {
  const dict = LOCALES[current] || LOCALES.zh;
  let s = dict[key];
  if (s === undefined) s = LOCALES.zh[key] !== undefined ? LOCALES.zh[key] : key;
  if (vars && typeof s === 'string') {
    s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
  }
  return s;
}

function getAllKeys() {
  const dict = LOCALES[current] || LOCALES.zh;
  return { ...dict };
}

module.exports = { t, loadLocale, getCurrentLocale, getAllKeys };
