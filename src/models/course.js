// Course model — CRUD, validation, and schedule generation.
//
// Schedule model: each course has a startDate, endDate, and a `restDates`
// array of ISO dates that are days off. `generateClassDates(course)` returns
// the ISO dates that ARE class days (the complement of restDates within the
// range). This unifies the legacy "scheduleType + sessions" model into a
// concrete list of rest days, which is more flexible (e.g. per-course custom
// holidays, makeup days).

const { genId } = require('../util/id');
const { parseISO, toISO, listRangeDates, countRangeDays } = require('../util/date');

// Schedule presets — applied to the editing modal's `restDates` to give
// quick defaults. All operate on an inclusive [start, end] date range.
const PRESETS = {
  all:        { label: '全选上课',   // "all class"
    fn: () => new Set() },
  none:       { label: '全休息',     // "all rest"
    fn: (all) => new Set(all) },
  weekdays:   { label: '仅工作日',   // "weekdays only" — rest on Sat+Sun
    fn: (all) => {
      const rest = new Set();
      all.forEach(d => {
        const dow = parseISO(d).getDay();
        if (dow === 0 || dow === 6) rest.add(d);
      });
      return rest;
    } },
  '5on1off':  { label: '上五休一',   // 5 days on, 1 day off
    fn: (all) => {
      const rest = new Set();
      all.forEach((d, i) => { if (i % 6 === 5) rest.add(d); });
      return rest;
    } },
  '6on1off':  { label: '上六休一',   // 6 days on, 1 day off
    fn: (all) => {
      const rest = new Set();
      all.forEach((d, i) => { if (i % 7 === 6) rest.add(d); });
      return rest;
    } },
};

function createCourse(input) {
  return {
    id: genId('c'),
    studentId: input.studentId,
    name: (input.name || '').trim(),
    subject: input.subject || '',
    className: (input.className || '').trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    startTime: input.startTime,
    endTime: input.endTime || '',
    location: (input.location || '').trim(),
    teacher: (input.teacher || '').trim(),
    room: (input.room || '').trim(),
    restDates: Array.isArray(input.restDates) ? input.restDates.slice() : [],
  };
}

function validateCourseInput(data) {
  if (!data.name || !data.name.trim()) return '请填写课程名称';
  if (!data.startDate || !data.endDate) return '请填写日期范围';
  if (data.startDate > data.endDate) return '开始日期不能晚于结束日期';
  if (!data.startTime) return '请填写开始时间';
  const total = countRangeDays(data.startDate, data.endDate);
  if (total === 0) return '日期范围无效';
  const restCount = (data.restDates || []).filter(
    d => d >= data.startDate && d <= data.endDate
  ).length;
  if (restCount >= total) return '至少需要保留 1 个上课日';
  return null;
}

// Returns the sorted ISO dates that ARE class days.
function generateClassDates(course) {
  if (!course.startDate || !course.endDate) return [];
  const dates = [];
  const rest = new Set(course.restDates || []);
  const all = listRangeDates(course.startDate, course.endDate);
  for (const iso of all) {
    if (!rest.has(iso)) dates.push(iso);
  }
  return dates;
}

function isCourseActive(course, refDate) {
  const today = refDate || require('../util/date').todayISO();
  if (today < course.startDate) return 'upcoming';
  if (today > course.endDate) return 'done';
  return 'active';
}

module.exports = {
  PRESETS,
  createCourse,
  validateCourseInput,
  generateClassDates,
  isCourseActive,
};
