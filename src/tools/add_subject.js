// Subject tool: add a new subject.
const { validateSubjectInput, CUSTOM_SUBJECT_PALETTE } = require('../models/subject');

module.exports = {
  name: 'add_subject',
  description: 'Create a new custom subject. Built-in subjects cannot be recreated.',
  inputSchema: {
    type: 'object',
    properties: {
      name:  { type: 'string' },
      color: { type: 'string', description: 'Hex color, e.g. #ef4444' },
    },
    required: ['name'],
  },
  outputSchema: { type: 'object' },
  async run({ name, color }, ctx) {
    const finalColor = color || CUSTOM_SUBJECT_PALETTE[0];
    let result = null;
    let dup = false;
    await ctx.store.update(data => {
      const err = validateSubjectInput({ name, color: finalColor }, data.subjects || []);
      if (err) { dup = true; throw new Error(err); }
      const subj = { name: name.trim(), color: finalColor, builtIn: false };
      if (!data.subjects) data.subjects = [];
      data.subjects.push(subj);
      result = subj;
    }).catch(err => { if (!dup) throw err; });
    if (dup) throw new Error('Subject already exists or validation failed');
    return result;
  },
};
