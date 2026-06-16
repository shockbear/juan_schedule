// Export tool: render a student's calendar to a PNG file using a headless
// browser (Puppeteer). This wraps src/export-png.js so the agent surface
// and the CLI surface share a single implementation.

const { exportCalendarPNG } = require('../export-png');

module.exports = {
  name: 'export_calendar',
  description: 'Render a student\'s monthly calendar to a PNG file using a headless browser (Puppeteer).',
  inputSchema: {
    type: 'object',
    properties: {
      studentId:    { type: 'string',  description: 'Student ID to render.' },
      month:        { type: 'string',  description: 'YYYY-MM. Defaults to current month.' },
      outputPath:   { type: 'string',  description: 'Where to write the PNG. Defaults to ./juan-schedule-<name>-<month>.png.' },
    },
    required: ['studentId'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      path:        { type: 'string' },
      studentId:   { type: 'string' },
      month:       { type: 'string' },
      studentName: { type: 'string' },
      dataPath:    { type: 'string' },
    },
  },
  async run({ studentId, month, outputPath }, ctx) {
    return exportCalendarPNG({ studentId, month, outputPath }, ctx);
  },
};
