// Course tool: list courses, optionally filtered by student.
module.exports = {
  name: 'list_courses',
  description: 'List courses. Optionally filter by studentId.',
  inputSchema: {
    type: 'object',
    properties: {
      studentId: { type: 'string', description: 'Filter to one student' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      courses: { type: 'array', items: { type: 'object' } },
    },
  },
  async run({ studentId }, ctx) {
    const data = await ctx.store.load();
    let courses = data.courses || [];
    if (studentId) courses = courses.filter(c => c.studentId === studentId);
    return { courses };
  },
};
