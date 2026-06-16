// Course tool: remove a course.
module.exports = {
  name: 'remove_course',
  description: 'Delete a course by id.',
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
  outputSchema: { type: 'object', properties: { removed: { type: 'boolean' } } },
  async run({ id }, ctx) {
    await ctx.store.update(data => {
      const before = data.courses.length;
      data.courses = (data.courses || []).filter(c => c.id !== id);
      if (data.courses.length === before) {
        throw new Error(`Course not found: ${id}`);
      }
    });
    return { removed: true };
  },
};
