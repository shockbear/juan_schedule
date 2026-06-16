// Tool registry — loads all 14 tools in src/tools/*.js and exposes them
// for both the CLI subcommands and the SKILL.md generation.

const fs = require('fs');
const path = require('path');

const TOOL_FILES = [
  'list_students', 'add_student', 'update_student', 'remove_student',
  'list_courses',  'add_course',  'update_course',  'remove_course',
  'list_subjects', 'add_subject', 'update_subject', 'remove_subject',
  'get_schedule',  'export_calendar',
];

const tools = {};
for (const name of TOOL_FILES) {
  const mod = require(path.join(__dirname, name + '.js'));
  tools[mod.name] = mod;
}

function listTools() {
  return Object.values(tools);
}

function getTool(name) {
  return tools[name] || null;
}

async function runTool(name, args, ctx) {
  const tool = tools[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.run(args || {}, ctx);
}

module.exports = { tools, listTools, getTool, runTool };
