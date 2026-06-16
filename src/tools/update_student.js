// Student tool: update an existing student.
const { validateStudentInput } = require('../models/student');

module.exports = {
  name: 'update_student',
  description: 'Update a student record by id. Only provided fields are changed.',
  inputSchema: {
    type: 'object',
    properties: {
      id:    { type: 'string', description: 'Student ID' },
      name:  { type: 'string' },
      color: { type: 'string' },
    },
    required: ['id'],
  },
  outputSchema: {
    type: 'object',
    properties: { id: { type: 'string' }, name: { type: 'string' }, color: { type: 'string' } },
  },
  async run({ id, name, color }, ctx) {
    const err = validateStudentInput({ name: name || 'x' });
    if (name !== undefined && err) throw new Error(err);
    let result = null;
    await ctx.store.update(data => {
      const stu = (data.students || []).find(s => s.id === id);
      if (!stu) throw new Error(`Student not found: ${id}`);
      if (name !== undefined) stu.name = name.trim();
      if (color !== undefined) stu.color = color;
      result = { ...stu };
    });
    return result;
  },
};
