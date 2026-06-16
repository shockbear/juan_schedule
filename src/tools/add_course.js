// Course tool: add a new course.
const { createCourse, validateCourseInput } = require('../models/course');

module.exports = {
  name: 'add_course',
  description: 'Create a new course. The schedule is derived from startDate, endDate, and restDates (a list of ISO dates that are days off).',
  inputSchema: {
    type: 'object',
    properties: {
      studentId:   { type: 'string', description: 'Owning student ID' },
      name:        { type: 'string' },
      subject:     { type: 'string', description: 'Subject name (must exist; use list_subjects)' },
      className:   { type: 'string' },
      startDate:   { type: 'string', description: 'YYYY-MM-DD' },
      endDate:     { type: 'string', description: 'YYYY-MM-DD' },
      startTime:   { type: 'string', description: 'HH:MM' },
      endTime:     { type: 'string', description: 'HH:MM (optional)' },
      location:    { type: 'string' },
      teacher:     { type: 'string' },
      room:        { type: 'string' },
      restDates:   { type: 'array', items: { type: 'string' }, description: 'ISO dates to skip' },
    },
    required: ['studentId', 'name', 'startDate', 'endDate', 'startTime'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      id:         { type: 'string' },
      classDates: { type: 'array', items: { type: 'string' } },
    },
  },
  async run(input, ctx) {
    const { generateClassDates } = require('../models/course');
    const err = validateCourseInput(input);
    if (err) throw new Error(err);
    const course = createCourse(input);
    await ctx.store.update(data => {
      data.courses.push(course);
    });
    const classDates = generateClassDates(course);
    return { id: course.id, classDates };
  },
};
