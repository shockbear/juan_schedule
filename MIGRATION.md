# 从旧版 `localStorage` 迁移

如果你的旧版 `index.html` 把数据存于浏览器的 `localStorage`，按下面三步迁移到新版 Skill 化、跨设备友好的格式。

## 1. 导出数据

在保存了数据的浏览器里打开 Web 界面。点击 **⚙ 设置** → **导出数据**。浏览器会下载一个 `juan-schedule-backup-YYYY-MM-DD.json` 文件。

## 2. 安装 CLI

```bash
git clone https://github.com/shockbear/juan_schedule
cd juan-schedule
npm install
```

## 3. 初始化并导入

```bash
# 用新的示例（或空）数据创建数据文件
npx juan-schedule init

# 导入你的旧数据
npx juan-schedule import --from /path/to/juan-schedule-backup-2026-07-01.json
```

导入完成后，数据文件位于 `~/.juan-schedule/data.json`，由 Web 界面、CLI 以及任何调用本 Skill 工具的 AI Agent 共享。

## 可选：启动 Web 服务

```bash
npx juan-schedule web
```

打开 `http://127.0.0.1:3737`。Web 界面会自动识别本地服务并切换至 HTTP 模式；否则回退到 `localStorage`。

## 数据格式

JSON 完全可读、可手工编辑。Schema：

```jsonc
{
  "version": 1,
  "lang": "zh",                // "zh" 或 "en"
  "theme": "light",            // "light" 或 "dark"
  "currentStudentId": "stu_xxx",
  "currentMonth": "2026-07",
  "statusFilter": "all",       // "all" | "active" | "upcoming" | "done"
  "students": [ { "id", "name", "color" } ],
  "subjects": [ { "name", "color", "builtIn": false } ],
  "courses": [{
    "id", "studentId", "name", "subject", "className",
    "startDate", "endDate", "startTime", "endTime",
    "location", "teacher", "room",
    "restDates": []
  }]
}
```

若 `version` 字段缺失或版本较旧，加载器会自动补齐默认值（如内置 `subjects` 列表）。