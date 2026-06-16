// Seed sample data — identical to the original web app's first-run payload.

const { BUILT_IN_SUBJECTS } = require('./models/subject');
const { genId } = require('./util/id');

function buildSampleData() {
  const stu1 = { id: genId('stu'), name: '秦若宁', color: '#4f8ef7' };
  const stu2 = { id: genId('stu'), name: '秦若媛', color: '#ec4899' };

  const courses = [
    {
      id: genId('c'), studentId: stu1.id,
      name: '蓝天物理-2026暑假1期', subject: '物理', className: 'P9睿学LH4',
      startDate: '2026-07-12', endDate: '2026-07-28',
      startTime: '08:30', endTime: '11:00',
      location: '罗湖汇鑫教学点', teacher: '冯惠', room: '605',
      restDates: ['2026-07-12', '2026-07-19', '2026-07-26'], // Sundays
    },
    {
      id: genId('c'), studentId: stu1.id,
      name: '蓝天数学-2026暑假1期', subject: '数学', className: 'M9好学LH4',
      startDate: '2026-07-12', endDate: '2026-07-28',
      startTime: '15:00', endTime: '17:30',
      location: '罗湖汇鑫教学点', teacher: '刘啸云', room: '407',
      restDates: ['2026-07-12', '2026-07-19', '2026-07-26'],
    },
    {
      id: genId('c'), studentId: stu1.id,
      name: '华青英语-2026暑假', subject: '英语', className: '暑假小组课',
      startDate: '2026-08-06', endDate: '2026-08-28',
      startTime: '10:30', endTime: '12:30',
      location: '文锦广场A座', teacher: '海瑞老师', room: '406',
      restDates: ['2026-08-11', '2026-08-17', '2026-08-23'],
    },
    {
      id: genId('c'), studentId: stu1.id,
      name: '华启语文-2026暑假', subject: '语文', className: '暑假小组课',
      startDate: '2026-08-06', endDate: '2026-08-28',
      startTime: '15:00', endTime: '17:30',
      location: '华启学府', teacher: '千喜老师', room: '待定',
      restDates: ['2026-08-11', '2026-08-17', '2026-08-23'],
    },
    {
      id: genId('c'), studentId: stu2.id,
      name: '蓝天语文-2026暑假1期', subject: '语文', className: 'C9素养LH2',
      startDate: '2026-07-12', endDate: '2026-07-28',
      startTime: '15:00', endTime: '',
      location: '罗湖汇鑫教学点', teacher: '张智超', room: '512',
      restDates: ['2026-07-12', '2026-07-19', '2026-07-26'],
    },
    {
      id: genId('c'), studentId: stu2.id,
      name: '蓝天数学-2026暑假1期', subject: '数学', className: 'M9睿学LH11',
      startDate: '2026-07-12', endDate: '2026-07-28',
      startTime: '18:00', endTime: '',
      location: '罗湖汇鑫教学点', teacher: '高源悦', room: '406',
      restDates: ['2026-07-12', '2026-07-19', '2026-07-26'],
    },
    {
      id: genId('c'), studentId: stu2.id,
      name: '大朋友英语-2026暑假', subject: '英语', className: '三期J3-3',
      startDate: '2026-08-15', endDate: '2026-08-27',
      startTime: '16:15', endTime: '18:15',
      location: '万科俊园', teacher: 'Phoebe Chen', room: '待定',
      restDates: ['2026-08-16', '2026-08-23'], // Sundays
    },
  ];

  return {
    students: [stu1, stu2],
    courses,
    subjects: BUILT_IN_SUBJECTS.map(s => ({ ...s, builtIn: true })),
    currentStudentId: stu1.id,
    currentView: 'calendar',
    currentMonth: '2026-07',
    theme: 'light',
    statusFilter: 'all',
    lang: 'zh',
    version: 1,
    initialized: true,
  };
}

module.exports = { buildSampleData };
