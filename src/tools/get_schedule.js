// Schedule tool: return the expanded class schedule — each entry is a single
// class day with the course, time, location, teacher, and room.
const { generateClassDates, isCourseActive } = require('../models/course');
const { listRangeDates } = require('../util/date');

module.exports = {
  name: 'get_schedule',
  description: 'Return the expanded class schedule for a date range, optionally filtered by student.',
  inputSchema: {
    type: 'object',
    properties: {
      studentId: { type: 'string', description: 'Filter to one student' },
      from:      { type: 'string', description: 'YYYY-MM-DD (inclusive)' },
      to:        { type: 'string', description: 'YYYY-MM-DD (inclusive)' },
    },
    required: ['from', 'to'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date:     { type: 'string' },
            studentId:{ type: 'string' },
            courseId: { type: 'string' },
            name:     { type: 'string' },
            subject:  { type: 'string' },
            startTime:{ type: 'string' },
            endTime:  { type: 'string' },
            location: { type: 'string' },
            teacher:  { type: 'string' },
            room:     { type: 'string' },
            status:   { type: 'string', enum: ['active', 'upcoming', 'done'] },
          },
        },
      },
    },
  },
  async run({ studentId, from, to }, ctx) {
    const data = await ctx.store.load();
    let courses = data.courses || [];
    if (studentId) courses = courses.filter(c => c.studentId === studentId);
    const items = [];
    for (const c of courses) {
      // Restrict to dates that fall within [from, to].
      const cStart = c.startDate, cEnd = c.endDate;
      if (!cStart || !cEnd) continue;
      const lo = from > cStart ? from : cStart;
      const hi = to < cEnd ? to : cEnd;
      if (lo > hi) continue;
      const allDays = listRangeDates(lo, hi);
      const classDates = new Set(generateClassDates(c));
      for (const date of allDays) {
        if (!classDates.has(date)) continue;
        items.push({
          date,
          studentId: c.studentId,
          courseId:  c.id,
          name:      c.name,
          subject:   c.subject,
          startTime: c.startTime,
          endTime:   c.endTime || '',
          location:  c.location || '',
          teacher:   c.teacher || '',
          room:      c.room || '',
          status:    isCourseActive(c, date),
        });
      }
    }
    items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    return { items };
  },
};
