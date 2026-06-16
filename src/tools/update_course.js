// Course tool: update an existing course.
const { validateCourseInput } = require('../models/course');

module.exports = {
  name: 'update_course',
  description: 'Update a course. Only provided fields are changed.',
  inputSchema: {
    type: 'object',
    properties: {
      id:          { type: 'string' },
      name:        { type: 'string' },
      subject:     { type: 'string' },
      className:   { type: 'string' },
      startDate:   { type: 'string' },
      endDate:     { type: 'string' },
      startTime:   { type: 'string' },
      endTime:     { type: 'string' },
      location:    { type: 'string' },
      teacher:     { type: 'string' },
      room:        { type: 'string' },
      restDates:   { type: 'array', items: { type: 'string' } },
    },
    required: ['id'],
  },
  outputSchema: { type: 'object' },
  async run({ id, ...patch }, ctx) {
    const { generateClassDates } = require('../models/course');
    let result = null;
    await ctx.store.update(data => {
      const c = (data.courses || []).find(x => x.id === id);
      if (!c) throw new Error(`Course not found: ${id}`);
      // If restDates is provided, replace; otherwise keep existing.
      const merged = { ...c, ...patch };
      const err = validateCourseInput(merged);
      if (err) throw new Error(err);
      Object.assign(c, patch);
      result = { ...c, classDates: generateClassDates(c) };
    });
    return result;
  },
};
