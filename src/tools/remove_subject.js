// Subject tool: remove a custom subject. Refuses if any course still uses it.
const { isBuiltInSubject } = require('../models/subject');

module.exports = {
  name: 'remove_subject',
  description: 'Delete a custom subject. Refuses if any course references it.',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  },
  outputSchema: { type: 'object' },
  async run({ name }, ctx) {
    if (isBuiltInSubject(name)) throw new Error('Built-in subjects cannot be removed');
    await ctx.store.update(data => {
      const used = (data.courses || []).filter(c => c.subject === name);
      if (used.length > 0) {
        throw new Error(`${used.length} course(s) still use this subject; remove or reassign first`);
      }
      const before = (data.subjects || []).length;
      data.subjects = (data.subjects || []).filter(s => s.name !== name);
      if (data.subjects.length === before) throw new Error(`Subject not found: ${name}`);
    });
    return { removed: true };
  },
};
