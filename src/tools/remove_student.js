// Student tool: remove a student (cascades to their courses).
module.exports = {
  name: 'remove_student',
  description: 'Delete a student by id. All their courses are also removed.',
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Student ID' } },
    required: ['id'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      removed:        { type: 'boolean' },
      removedCourses: { type: 'integer' },
    },
  },
  async run({ id }, ctx) {
    let removedCourses = 0;
    await ctx.store.update(data => {
      const before = data.students.length;
      data.students = (data.students || []).filter(s => s.id !== id);
      if (data.students.length === before) {
        throw new Error(`Student not found: ${id}`);
      }
      const beforeCourses = data.courses.length;
      data.courses = (data.courses || []).filter(c => c.studentId !== id);
      removedCourses = beforeCourses - data.courses.length;
      if (data.currentStudentId === id) {
        data.currentStudentId = data.students[0] ? data.students[0].id : null;
      }
    });
    return { removed: true, removedCourses };
  },
};
