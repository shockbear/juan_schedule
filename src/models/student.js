// Student model — simple CRUD factories and validation.

const { genId } = require('../util/id');

const STUDENT_PALETTE = [
  '#4f8ef7', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16',
];

function createStudent({ name, color }) {
  return {
    id: genId('stu'),
    name: (name || '').trim(),
    color: color || STUDENT_PALETTE[0],
  };
}

function validateStudentInput({ name }) {
  if (!name || !name.trim()) return '请填写学生姓名';
  if (name.trim().length > 20) return '姓名过长（最多 20 个字符）';
  return null;
}

module.exports = {
  STUDENT_PALETTE,
  createStudent,
  validateStudentInput,
};
