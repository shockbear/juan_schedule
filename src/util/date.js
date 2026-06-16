// Date utilities — isomorphic (browser + Node).
// All inputs/outputs use ISO format `YYYY-MM-DD` for dates and `HH:MM` for times.

function parseISO(s) {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayISO() {
  return toISO(new Date());
}

// "2026-07" → "2026年7月" (zh) / "Jul 2026" (en)
function fmtMonth(yearMonth, lang = 'zh') {
  const [y, m] = yearMonth.split('-').map(Number);
  if (lang === 'en') {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${names[m - 1]} ${y}`;
  }
  return `${y}年${parseInt(m, 10)}月`;
}

// "2026-07-12" → "7月12日" (zh) / "Jul 12" (en)
function fmtDateCN(iso, lang = 'zh') {
  const d = parseISO(iso);
  if (!d) return iso;
  if (lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// "2026-07-12" → "2026年7月12日 周一" (zh) / "Mon, Jul 12, 2026" (en)
// Week starts on Monday. getDay() returns 0=Sun..6=Sat; Monday index = (getDay()+6)%7
function fmtDateFull(iso, lang = 'zh') {
  const d = parseISO(iso);
  if (!d) return iso;
  const dowIdx = (d.getDay() + 6) % 7;
  if (lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `${days[dowIdx]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  const cnDays = ['一', '二', '三', '四', '五', '六', '日'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${cnDays[dowIdx]}`;
}

function fmtTimeRange(start, end) {
  return end ? `${start} - ${end}` : start;
}

// Inclusive day count between two ISO dates; returns 0 if invalid.
function countRangeDays(startIso, endIso) {
  if (!startIso || !endIso || startIso > endIso) return 0;
  const s = parseISO(startIso);
  const e = parseISO(endIso);
  if (!s || !e) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

// Inclusive ISO date array between two ISO dates.
function listRangeDates(startIso, endIso) {
  if (!startIso || !endIso || startIso > endIso) return [];
  const s = parseISO(startIso);
  const e = parseISO(endIso);
  if (!s || !e) return [];
  const out = [];
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(toISO(d));
  }
  return out;
}

// Monday-first weekday name (0=Mon..6=Sun)
const WEEKDAY_NAMES_CN = ['一', '二', '三', '四', '五', '六', '日'];
const WEEKDAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekdayNames(lang = 'zh') {
  return lang === 'en' ? WEEKDAY_NAMES_EN : WEEKDAY_NAMES_CN;
}

module.exports = {
  parseISO,
  toISO,
  todayISO,
  fmtMonth,
  fmtDateCN,
  fmtDateFull,
  fmtTimeRange,
  countRangeDays,
  listRangeDates,
  getWeekdayNames,
  WEEKDAY_NAMES_CN,
  WEEKDAY_NAMES_EN,
};
