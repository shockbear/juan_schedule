// Smoke test for juan-schedule — exercises the full pipeline:
//   - init / seed
//   - student/course CRUD (CLI tools)
//   - get_schedule
//   - headless PNG export (the new Puppeteer feature)
//
// Usage:  npm test
//         (or: node test/smoke.js)
//
// The test writes a throwaway data file under the OS temp dir so it
// never touches the user's real ~/.juan-schedule/data.json.

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

const TMP_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'juan-smoke-'));
process.env.JUAN_SCHEDULE_HOME = TMP_HOME;

const store = require('../src/store');
const tools = require('../src/tools');
const { exportCalendarPNG } = require('../src/export-png');
const i18n = require('../src/i18n');

const ctx = () => ({ store, i18n });
const run = (name, args) => tools.getTool(name).run(args, ctx());
let step = 0;

function log(msg) {
  step += 1;
  console.log(`[${String(step).padStart(2, '0')}] ${msg}`);
}

(async () => {
  log('home dir: ' + TMP_HOME);

  // 1. seed
  log('init: seed sample data');
  const seed = await store.seedIfEmpty();
  assert.ok(seed.students.length >= 2, 'expected at least 2 seeded students');
  assert.ok(seed.courses.length  >= 5, 'expected at least 5 seeded courses');
  const studentId = seed.students[0].id;

  // 2. list students
  log('list_students: get all students');
  const lst = await run('list_students', {});
  assert.ok(lst.students.length >= 2);

  // 3. add student
  log('add_student: create a new student');
  const newStu = await run('add_student', { name: 'Smoke Test', color: '#ff8800' });
  assert.strictEqual(newStu.name, 'Smoke Test');

  // 4. add course
  log('add_course: create a 5-day course (with a custom subject)');
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today.getTime() + 4 * 86400000).toISOString().slice(0, 10);
  await run('add_subject', { name: 'SmokeSubject', color: '#123456' });
  const newCourse = await run('add_course', {
    studentId: studentId,
    name: 'Smoke Course',
    subject: 'SmokeSubject',
    className: 'TEST',
    startDate: start,
    endDate: endDate,
    startTime: '09:00',
    endTime: '10:00',
    restDates: [],
  });
  assert.ok(newCourse.id, 'course should have an id');
  assert.ok(newCourse.classDates.length >= 1, 'course should have class dates');

  // 5. get_schedule
  log('get_schedule: expanded dates for student');
  const sched = await run('get_schedule', {
    studentId: studentId,
    from: start,
    to: endDate,
  });
  assert.ok(Array.isArray(sched.items) && sched.items.length >= 1,
    'get_schedule should return at least one item');

  // 6. update_subject cascade
  log('update_subject: rename and verify cascade');
  const subUpd = await run('update_subject', { name: 'SmokeSubject', newName: 'SmokeSubjectX' });
  // The original course used SmokeSubject, so cascade should have updated it.
  assert.ok(subUpd.cascadeCount >= 1, 'cascade should have hit at least one course');
  // Restore
  await run('update_subject', { name: 'SmokeSubjectX', newName: 'SmokeSubject' });

  // 7. remove_course
  log('remove_course: delete the test course');
  await run('remove_course', { id: newCourse.id });
  const after = await run('list_courses', { studentId });
  assert.ok(!after.courses.find(c => c.id === newCourse.id),
    'removed course should not appear');

  // 8. remove_student (cleanup)
  log('remove_student: delete the smoke test student');
  await run('remove_student', { id: newStu.id });

  // 9. Puppeteer export (optional — only if puppeteer is installed)
  log('export_calendar: headless PNG render (skipped if puppeteer missing)');
  let puppeteer;
  try { puppeteer = require('puppeteer'); } catch (_) { /* not installed */ }
  if (puppeteer) {
    const out = path.join(TMP_HOME, 'smoke-export.png');
    const r = await exportCalendarPNG({ studentId, month: '2026-07', outputPath: out }, ctx());
    assert.ok(fs.existsSync(out), 'PNG file should exist');
    const buf = fs.readFileSync(out);
    assert.ok(buf.length > 5000, 'PNG should be reasonably sized');
    const sig = buf.slice(0, 8).toString('hex');
    assert.strictEqual(sig, '89504e470d0a1a0a', 'valid PNG signature');
    log(`   exported ${r.path} (${buf.length} bytes)`);
  } else {
    log('   skipped: puppeteer not installed (optional dep)');
  }

  // 10. i18n roundtrip
  log('i18n: switch to English and verify key resolves');
  i18n.loadLocale('en');
  assert.ok(i18n.t('msg.exported_to', { path: '/tmp/x.png' }).includes('Exported'));
  i18n.loadLocale('zh');

  log('ALL CHECKS PASSED');
  // Cleanup tmp home
  try { fs.rmSync(TMP_HOME, { recursive: true, force: true }); } catch (_) {}
  process.exit(0);
})().catch(err => {
  console.error('SMOKE TEST FAILED:', err);
  process.exit(1);
});
