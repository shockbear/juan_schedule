// Subject tool: list all subjects (built-in + custom).
module.exports = {
  name: 'list_subjects',
  description: 'List all subjects, including built-in and custom.',
  inputSchema: { type: 'object', properties: {} },
  outputSchema: {
    type: 'object',
    properties: {
      subjects: { type: 'array', items: { type: 'object' } },
    },
  },
  async run(args, ctx) {
    const data = await ctx.store.load();
    return { subjects: data.subjects || [] };
  },
};
