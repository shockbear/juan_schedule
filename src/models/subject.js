// Subject model — built-in + custom. Colors, built-in flag, validation.

const BUILT_IN_SUBJECTS = [
  { name: '物理', color: '#3b82f6' },
  { name: '化学', color: '#06b6d4' },
  { name: '数学', color: '#10b981' },
  { name: '英语', color: '#f59e0b' },
  { name: '语文', color: '#ec4899' },
  { name: '其他', color: '#8b5cf6' },
];

const CUSTOM_SUBJECT_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1',
  '#a855f7', '#d946ef', '#f43f5e', '#64748b',
];

const DEFAULT_SUBJECT_COLOR = BUILT_IN_SUBJECTS[BUILT_IN_SUBJECTS.length - 1].color;

function isBuiltInSubject(name) {
  return BUILT_IN_SUBJECTS.some(s => s.name === name);
}

function getSubjectColor(subjects, name) {
  if (!name) return DEFAULT_SUBJECT_COLOR;
  const found = (subjects || []).find(s => s.name === name);
  if (found) return found.color;
  const builtIn = BUILT_IN_SUBJECTS.find(s => s.name === name);
  return builtIn ? builtIn.color : DEFAULT_SUBJECT_COLOR;
}

// Validate subject input. Returns null on success, error message on failure.
function validateSubjectInput({ name, color }, existingSubjects = []) {
  if (!name || !name.trim()) return '请填写科目名称';
  const trimmed = name.trim();
  if (trimmed.length > 12) return '科目名称过长（最多 12 个字符）';
  if (existingSubjects.some(s => s.name === trimmed)) return '科目已存在';
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return '颜色格式无效';
  return null;
}

// Apply cascade rename: when a subject's name changes, update all courses.
// Returns the list of course IDs that were affected.
function applyCascadeRename(subjects, courses, oldName, newName) {
  if (!oldName || !newName || oldName === newName) return [];
  const affected = [];
  courses.forEach(c => {
    if (c.subject === oldName) {
      c.subject = newName;
      affected.push(c.id);
    }
  });
  return affected;
}

module.exports = {
  BUILT_IN_SUBJECTS,
  CUSTOM_SUBJECT_PALETTE,
  DEFAULT_SUBJECT_COLOR,
  isBuiltInSubject,
  getSubjectColor,
  validateSubjectInput,
  applyCascadeRename,
};
