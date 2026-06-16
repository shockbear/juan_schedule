// Subject tool: update an existing subject. Built-in subjects cannot be renamed,
// only their color can be changed. Renaming cascades to all courses.
const { isBuiltInSubject, applyCascadeRename } = require('../models/subject');

module.exports = {
  name: 'update_subject',
  description: 'Update a subject. Renaming cascades to all courses using it.',
  inputSchema: {
    type: 'object',
    properties: {
      name:  { type: 'string', description: 'Current name (used to find)' },
      newName: { type: 'string', description: 'New name (omit to keep)' },
      color: { type: 'string' },
    },
    required: ['name'],
  },
  outputSchema: { type: 'object' },
  async run({ name, newName, color }, ctx) {
    let result = null;
    let cascadeCount = 0;
    await ctx.store.update(data => {
      const subj = (data.subjects || []).find(s => s.name === name);
      if (!subj) throw new Error(`Subject not found: ${name}`);
      const builtIn = isBuiltInSubject(name);
      if (builtIn && newName && newName !== name) {
        throw new Error('Built-in subjects cannot be renamed');
      }
      if (newName && newName !== name) {
        if ((data.subjects || []).some(s => s.name === newName && s !== subj)) {
          throw new Error('Target name already exists');
        }
        const affected = applyCascadeRename(data.subjects, data.courses, name, newName);
        cascadeCount = affected.length;
        subj.name = newName;
      }
      if (color) subj.color = color;
      result = { ...subj, cascadeCount };
    });
    return result;
  },
};
