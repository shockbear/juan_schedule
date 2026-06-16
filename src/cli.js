#!/usr/bin/env node
// juan-schedule CLI
//
// Usage:
//   juan-schedule init
//   juan-schedule web [--port 3737] [--host 127.0.0.1]
//   juan-schedule student list|add|update|remove ...
//   juan-schedule course  list|add|update|remove ...
//   juan-schedule subject list|add|update|remove ...
//   juan-schedule schedule get --student <id> --from YYYY-MM-DD --to YYYY-MM-DD
//   juan-schedule export  png --student <id> --month YYYY-MM
//   juan-schedule import  --from <file>
//   juan-schedule lang    zh|en
//   juan-schedule config  [--get key] [--set key=value]
//   juan-schedule version
//
// All commands support --json for machine-readable output (for Agent use).

const path = require('path');
const fs = require('fs');
const { Command } = require('commander');
const store = require('./store');
const server = require('./server');
const i18n = require('./i18n');
const { listTools, getTool } = require('./tools');
const { getDataPath } = require('./util/path');

const program = new Command();
program
  .name('juan-schedule')
  .description(i18n.t('cli.cmd.web.desc') + ' / ' + i18n.t('cli.cmd.init.desc'))
  .version('0.1.0')
  .option('--json', i18n.t('cli.flag.json.desc'))
  .option('--lang <lang>', 'Override interface language');

// === Helpers ===
function outputJson(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}
function outputHuman(text) {
  process.stdout.write(text + '\n');
}
function isJsonMode() {
  return program.opts().json === true;
}
function ctx() {
  return { store, i18n };
}

function parseRestDates(v) {
  if (!v) return [];
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

async function runTool(name, args) {
  return getTool(name).run(args, ctx());
}

// === init ===
program
  .command('init')
  .description(i18n.t('cli.cmd.init.desc'))
  .action(async () => {
    const data = await store.seedIfEmpty();
    outputHuman(i18n.t('msg.saved_to', { path: getDataPath() }));
    if (isJsonMode()) outputJson({ ok: true, path: getDataPath(), students: data.students.length, courses: data.courses.length });
  });

// === web ===
program
  .command('web')
  .description(i18n.t('cli.cmd.web.desc'))
  .option('-p, --port <port>', i18n.t('cli.flag.port.desc'), '3737')
  .option('-H, --host <host>', i18n.t('cli.flag.host.desc'), '127.0.0.1')
  .action(async (opts) => {
    // Ensure data exists so the Web UI has something to show.
    await store.seedIfEmpty();
    try {
      await server.start({ port: parseInt(opts.port, 10), host: opts.host });
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  });

// === student ===
const studentCmd = program.command('student').description(i18n.t('cli.cmd.student.desc'));
studentCmd
  .command('list')
  .description('List all students')
  .action(async () => {
    const r = await runTool('list_students', {});
    if (isJsonMode()) outputJson(r);
    else r.students.forEach(s => outputHuman(`${s.id}  ${s.name}  (${i18n.t('msg.courses_count', { n: s.courseCount })})`));
  });
studentCmd
  .command('add')
  .description('Add a student')
  .requiredOption('-n, --name <name>', i18n.t('cli.flag.name.desc'))
  .option('-c, --color <color>', i18n.t('cli.flag.color.desc'), '#4f8ef7')
  .action(async (opts) => {
    try {
      const r = await runTool('add_student', { name: opts.name, color: opts.color });
      if (isJsonMode()) outputJson(r);
      else outputHuman(`added ${r.id}  ${r.name}`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });
studentCmd
  .command('update')
  .description('Update a student')
  .requiredOption('-i, --id <id>', i18n.t('cli.flag.id.desc'))
  .option('-n, --name <name>', i18n.t('cli.flag.name.desc'))
  .option('-c, --color <color>', i18n.t('cli.flag.color.desc'))
  .action(async (opts) => {
    try {
      const patch = { id: opts.id };
      if (opts.name) patch.name = opts.name;
      if (opts.color) patch.color = opts.color;
      const r = await runTool('update_student', patch);
      if (isJsonMode()) outputJson(r);
      else outputHuman(`updated ${r.id}`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });
studentCmd
  .command('remove')
  .description('Remove a student and all their courses')
  .requiredOption('-i, --id <id>', i18n.t('cli.flag.id.desc'))
  .action(async (opts) => {
    try {
      const r = await runTool('remove_student', { id: opts.id });
      if (isJsonMode()) outputJson(r);
      else outputHuman(`removed ${opts.id} (${r.removedCourses} courses)`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });

// === course ===
const courseCmd = program.command('course').description(i18n.t('cli.cmd.course.desc'));
courseCmd
  .command('list')
  .description('List courses')
  .option('-s, --student <id>', i18n.t('cli.flag.student.desc'))
  .action(async (opts) => {
    const r = await runTool('list_courses', { studentId: opts.student });
    if (isJsonMode()) outputJson(r);
    else r.courses.forEach(c => outputHuman(`${c.id}  ${c.startDate}~${c.endDate}  ${c.startTime}  ${c.subject}  ${c.name}`));
  });
courseCmd
  .command('add')
  .description('Add a course')
  .requiredOption('-s, --student <id>', i18n.t('cli.flag.student.desc'))
  .requiredOption('-n, --name <name>', i18n.t('cli.flag.name.desc'))
  .option('--subject <name>', i18n.t('cli.flag.subject.desc'))
  .option('--class <name>', i18n.t('cli.flag.class.desc'))
  .requiredOption('--start-date <date>', i18n.t('cli.flag.start_date.desc'))
  .requiredOption('--end-date <date>', i18n.t('cli.flag.end_date.desc'))
  .requiredOption('--start-time <time>', i18n.t('cli.flag.start_time.desc'))
  .option('--end-time <time>', i18n.t('cli.flag.end_time.desc'))
  .option('--location <loc>', i18n.t('cli.flag.location.desc'))
  .option('--teacher <name>', i18n.t('cli.flag.teacher.desc'))
  .option('--room <room>', i18n.t('cli.flag.room.desc'))
  .option('--rest-dates <list>', i18n.t('cli.flag.rest_dates.desc'))
  .action(async (opts) => {
    try {
      const args = {
        studentId: opts.student,
        name: opts.name,
        subject: opts.subject,
        className: opts.class,
        startDate: opts.startDate,
        endDate: opts.endDate,
        startTime: opts.startTime,
        endTime: opts.endTime,
        location: opts.location,
        teacher: opts.teacher,
        room: opts.room,
        restDates: parseRestDates(opts.restDates),
      };
      const r = await runTool('add_course', args);
      if (isJsonMode()) outputJson(r);
      else outputHuman(`added ${r.id}  (${r.classDates.length} class days)`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });
courseCmd
  .command('update')
  .description('Update a course')
  .requiredOption('-i, --id <id>', i18n.t('cli.flag.id.desc'))
  .option('-n, --name <name>')
  .option('--subject <name>')
  .option('--class <name>')
  .option('--start-date <date>')
  .option('--end-date <date>')
  .option('--start-time <time>')
  .option('--end-time <time>')
  .option('--location <loc>')
  .option('--teacher <name>')
  .option('--room <room>')
  .option('--rest-dates <list>')
  .action(async (opts) => {
    try {
      const patch = { id: opts.id };
      if (opts.name) patch.name = opts.name;
      if (opts.subject) patch.subject = opts.subject;
      if (opts.class) patch.className = opts.class;
      if (opts.startDate) patch.startDate = opts.startDate;
      if (opts.endDate) patch.endDate = opts.endDate;
      if (opts.startTime) patch.startTime = opts.startTime;
      if (opts.endTime !== undefined) patch.endTime = opts.endTime;
      if (opts.location) patch.location = opts.location;
      if (opts.teacher) patch.teacher = opts.teacher;
      if (opts.room) patch.room = opts.room;
      if (opts.restDates !== undefined) patch.restDates = parseRestDates(opts.restDates);
      const r = await runTool('update_course', patch);
      if (isJsonMode()) outputJson(r);
      else outputHuman(`updated ${r.id}`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });
courseCmd
  .command('remove')
  .description('Remove a course')
  .requiredOption('-i, --id <id>', i18n.t('cli.flag.id.desc'))
  .action(async (opts) => {
    try {
      await runTool('remove_course', { id: opts.id });
      if (isJsonMode()) outputJson({ ok: true });
      else outputHuman(`removed ${opts.id}`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });

// === subject ===
const subjectCmd = program.command('subject').description(i18n.t('cli.cmd.subject.desc'));
subjectCmd
  .command('list')
  .description('List subjects')
  .action(async () => {
    const r = await runTool('list_subjects', {});
    if (isJsonMode()) outputJson(r);
    else r.subjects.forEach(s => outputHuman(`${s.name}  ${s.color}  ${s.builtIn ? '(built-in)' : '(custom)'}`));
  });
subjectCmd
  .command('add')
  .description('Add a subject')
  .requiredOption('-n, --name <name>', i18n.t('cli.flag.name.desc'))
  .option('-c, --color <color>', i18n.t('cli.flag.color.desc'), '#ef4444')
  .action(async (opts) => {
    try {
      const r = await runTool('add_subject', { name: opts.name, color: opts.color });
      if (isJsonMode()) outputJson(r);
      else outputHuman(`added ${r.name}`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });
subjectCmd
  .command('update')
  .description('Update a subject')
  .requiredOption('-n, --name <name>', 'Current name')
  .option('--new-name <name>', 'New name (omit to keep)')
  .option('-c, --color <color>', i18n.t('cli.flag.color.desc'))
  .action(async (opts) => {
    try {
      const patch = { name: opts.name };
      if (opts.newName) patch.newName = opts.newName;
      if (opts.color) patch.color = opts.color;
      const r = await runTool('update_subject', patch);
      if (isJsonMode()) outputJson(r);
      else outputHuman(`updated ${r.name} (cascade: ${r.cascadeCount} courses)`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });
subjectCmd
  .command('remove')
  .description('Remove a subject')
  .requiredOption('-n, --name <name>', i18n.t('cli.flag.name.desc'))
  .action(async (opts) => {
    try {
      await runTool('remove_subject', { name: opts.name });
      if (isJsonMode()) outputJson({ ok: true });
      else outputHuman(`removed ${opts.name}`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });

// === schedule ===
const scheduleCmd = program.command('schedule').description(i18n.t('cli.cmd.schedule.desc'));
scheduleCmd
  .command('get')
  .description('Get the expanded class schedule for a date range')
  .option('-s, --student <id>', i18n.t('cli.flag.student.desc'))
  .requiredOption('--from <date>', i18n.t('cli.flag.from.desc'))
  .requiredOption('--to <date>', i18n.t('cli.flag.to.desc'))
  .action(async (opts) => {
    const r = await runTool('get_schedule', {
      studentId: opts.student,
      from: opts.from,
      to: opts.to,
    });
    if (isJsonMode()) outputJson(r);
    else r.items.forEach(it => outputHuman(`${it.date}  ${it.startTime}  ${it.subject}  ${it.name}  @ ${it.location}`));
  });

// === export ===
const exportCmd = program.command('export').description(i18n.t('cli.cmd.export.desc'));
exportCmd
  .command('png')
  .description(i18n.t('cli.cmd.export.png.desc'))
  .requiredOption('-s, --student <id>', i18n.t('cli.flag.student.desc'))
  .option('-m, --month <YYYY-MM>', i18n.t('cli.flag.month.desc'))
  .option('-o, --output <path>', i18n.t('cli.flag.output.desc'))
  .action(async (opts) => {
    try {
      const { exportCalendarPNG } = require('./export-png');
      const r = await exportCalendarPNG(
        { studentId: opts.student, month: opts.month, outputPath: opts.output },
        ctx()
      );
      if (isJsonMode()) outputJson(r);
      else outputHuman(i18n.t('msg.exported_to', { path: r.path }));
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });

// === import ===
program
  .command('import')
  .description(i18n.t('cli.cmd.import.desc'))
  .requiredOption('-f, --from <file>', i18n.t('cli.flag.from_file.desc'))
  .action(async (opts) => {
    try {
      const raw = fs.readFileSync(opts.from, 'utf8');
      const data = JSON.parse(raw);
      const result = await store.importJSON(data);
      if (isJsonMode()) outputJson({ ok: true, students: result.students.length, courses: result.courses.length });
      else outputHuman(`imported ${result.students.length} students, ${result.courses.length} courses`);
    } catch (e) {
      console.error('Error: ' + e.message);
      process.exit(1);
    }
  });

// === lang ===
program
  .command('lang <code>')
  .description(i18n.t('cli.cmd.lang.desc'))
  .action(async (code) => {
    if (!i18n.loadLocale(code)) {
      console.error(`Unknown language: ${code}`);
      process.exit(1);
    }
    await store.update(data => { data.lang = code; });
    outputHuman(`lang=${code}`);
  });

// === config ===
program
  .command('config')
  .description(i18n.t('cli.cmd.config.desc'))
  .option('--get <key>', 'Get a config value')
  .option('--set <kv>', 'Set a config value (key=value)')
  .action(async (opts) => {
    if (opts.get) {
      const data = await store.load();
      const v = data[opts.get];
      if (isJsonMode()) outputJson({ [opts.get]: v });
      else outputHuman(v === undefined ? '(unset)' : String(v));
      return;
    }
    if (opts.set) {
      const [k, ...rest] = opts.set.split('=');
      const v = rest.join('=');
      await store.update(data => { data[k] = v; });
      outputHuman(`${k}=${v}`);
      return;
    }
    const data = await store.load();
    if (isJsonMode()) outputJson({
      dataPath: getDataPath(),
      lang: data.lang,
      theme: data.theme,
      currentStudentId: data.currentStudentId,
      currentMonth: data.currentMonth,
    });
    else {
      outputHuman(`data path: ${getDataPath()}`);
      outputHuman(`lang:       ${data.lang}`);
      outputHuman(`theme:      ${data.theme}`);
      outputHuman(`student:    ${data.currentStudentId}`);
      outputHuman(`month:      ${data.currentMonth}`);
    }
  });

// === version ===
program
  .command('version')
  .description(i18n.t('cli.cmd.version.desc'))
  .action(() => {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    outputHuman(`${pkg.name} v${pkg.version}`);
  });

program.parseAsync(process.argv).catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
