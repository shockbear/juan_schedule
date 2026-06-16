# 更新日志

本文件记录 `juan-schedule` 的所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/)，版本号遵循 [语义化版本](https://semver.org/)。

## [0.1.0] - 2026-06-16

### 新增 (Added)
- **Web 界面**（`index.html`）：单文件自包含，内嵌 CSS+JS，
  双击即用，自动探测本地 `juan-schedule web` 服务。
- **CLI**（`juan-schedule` 命令）子命令：`init`、`web`、
  `student list|add|update|remove`、`course list|add|update|remove`、
  `subject list|add|update|remove`、`schedule get`、`export png`、
  `import`、`lang`、`config`、`version`。所有命令均支持 `--json`。
- **AI Agent Skill 接口**：`src/tools/` 下 14 个工具，
  `SKILL.md` 含 OpenClaw 风格的 YAML frontmatter，便于 Agent 自动发现。
- **存储层**（`src/store.js`）：单一 JSON 文件位于
  `~/.juan-schedule/data.json`（可通过 `JUAN_SCHEDULE_HOME` 覆盖），
  原子写入（`.tmp` + `rename`），文件损坏时自动备份。
- **内置科目**（物理 / 化学 / 数学 / 英语 / 语文 / 其他），
  改名时会安全级联到所有引用该科目的课程。
- **i18n**：界面完整支持中文与英文；Agent 工具 schema 固定英文，
  以保证跨语言 Agent 兼容性。
- **PNG 导出**（Puppeteer，可选依赖）：
  - CLI：`juan-schedule export png -s <id> -m 2026-07 -o out.png`
  - HTTP：`GET /api/export.png?student=<id>&month=YYYY-MM`
  - 渲染干净的打印版日历布局（不含交互控件）。
- **MIGRATION.md**：帮助旧版 `localStorage` 单文件用户迁移。

### 备注 (Notes)
- `puppeteer` 是**可选**依赖——`npm install` 默认不会下载 Chromium，
  仅当真正需要 PNG 导出功能时才下载。
- 已通过 Node 16+ 测试（使用 `URLSearchParams`、`AbortSignal.timeout`）。