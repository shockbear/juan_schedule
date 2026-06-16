// Student tool: list all students.
module.exports = {
  name: 'list_students',
  description: 'List all students in the system.',
  inputSchema: { type: 'object', properties: {} },
  outputSchema: {
    type: 'object',
    properties: {
      students: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            color: { type: 'string' },
            courseCount: { type: 'integer' },
          },
        },
      },
    },
  },
  async run(args, ctx) {
    const data = await ctx.store.load();
    const students = (data.students || []).map(s => ({
      ...s,
      courseCount: (data.courses || []).filter(c => c.studentId === s.id).length,
    }));
    return { students };
  },
};
