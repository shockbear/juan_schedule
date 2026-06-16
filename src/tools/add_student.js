// Student tool: add a new student.
const { createStudent, validateStudentInput } = require('../models/student');

module.exports = {
  name: 'add_student',
  description: 'Create a new student record.',
  inputSchema: {
    type: 'object',
    properties: {
      name:  { type: 'string', description: 'Student name' },
      color: { type: 'string', description: 'Hex color, e.g. #4f8ef7' },
    },
    required: ['name'],
  },
  outputSchema: {
    type: 'object',
    properties: { id: { type: 'string' }, name: { type: 'string' }, color: { type: 'string' } },
  },
  async run({ name, color }, ctx) {
    const err = validateStudentInput({ name });
    if (err) throw new Error(err);
    const stu = createStudent({ name, color });
    await ctx.store.update(data => {
      data.students.push(stu);
      if (!data.currentStudentId) data.currentStudentId = stu.id;
    });
    return stu;
  },
};
