---
name: juan-schedule
description: 卷王多人培训课程管理 - 为多个学生管理培训课程（日历、排课、导出）。提供 14 个工具，覆盖学生、课程、科目、排课表与 PNG 导出。数据与 Web 界面共享，以单个 JSON 文件存于 ~/.juan-schedule/data.json。英文版描述：Manage training courses for multiple students (calendar, schedule, export). Provides 14 tools for students, courses, subjects, schedules, and PNG export. Data is shared with the Web UI and persisted as a single JSON file at ~/.juan-schedule/data.json.
version: 0.1.0
license: MIT
runtime: node >= 16
entry: src/cli.js
---

# juan-schedule

一个本地优先的 Skill，用于管理**多个学生的培训课程**——物理、数学、英语、音乐课等——覆盖日历、排课表、导出等流程。数据保存在一份 JSON 文件中，由 Web 界面、CLI、任何调用这些工具的 AI Agent 共享。

> **约定**：下面的工具名、参数名、JSON 字段名、TypeScript 风格的 schema 块**均为英文**（Agent 调用契约）；描述、说明、使用示例可中英混排。人类 CLI 用户可使用 `juan-schedule lang en` 把命令行切成英文。

## 何时使用本 Skill

- 用户有多个孩子 / 学生，各自上不同的培训班
- 用户想看"下周一下午有什么课"或"周三下午有没有冲突"
- 用户想在不打开 Web 界面的情况下新增 / 修改 / 删除一门课
- 用户想把日历导出为 PNG，分享给家人或老师

## 数据模型

```jsonc
{
  "students":  [ { "id", "name", "color" } ],
  "subjects":  [ { "id", "name", "color", "builtIn": false } ],
  "courses":   [{
    "id", "studentId", "name", "subject", "className",
    "startDate", "endDate", "startTime", "endTime",
    "location", "teacher", "room",
    "restDates": []   // ISO 日期数组；上课日 = 区间内日期 - restDates
  }],
  "currentStudentId": "stu_xxx",
  "currentMonth": "2026-07",
  "lang": "zh", "theme": "light"
}
```

一门课的"上课日"按 `[startDate, endDate]` 区间减去 `restDates` 计算得出。这一模型足够灵活，既能表达每天上课、仅工作日、上五休一、上六休一，也能表达任何自定义的休息模式。

## 工具列表（14 个）

所有工具描述与参数名**固定英文**（这是 Agent 面对的契约）。错误消息与 CLI 帮助本地化；用户可随时在 Web 界面 / CLI 切 `zh` ↔ `en`。

### 1. list_students
列出所有学生。
- input: `{}`
- output: `{ students: [{ id, name, color, courseCount }] }`

### 2. add_student
新建一个学生。
- input: `{ name: string, color?: string /* #RRGGBB */ }`
- output: `{ id, name, color }`

### 3. update_student
更新一个学生。仅修改传入的字段。
- input: `{ id, name?, color? }`
- output: `{ id, name, color }`

### 4. remove_student
删除一个学生并**级联删除其全部课程**。
- input: `{ id }`
- output: `{ removed: true, removedCourses: number }`

### 5. list_courses
列出课程，可按学生过滤。
- input: `{ studentId?: string }`
- output: `{ courses: [Course] }`

### 6. add_course
新建一门课。**必须先调用 `list_students` 与 `list_subjects`** 拿到合法的 ID 与科目名。
- input:
  ```ts
  {
    studentId: string,        // 必填
    name: string,              // 必填，课程显示名
    startDate: string,         // YYYY-MM-DD，必填
    endDate: string,           // YYYY-MM-DD，必填
    startTime: string,         // HH:MM，必填
    subject?: string,          // 必须在 subjects 中存在
    className?: string,
    endTime?: string,          // HH:MM
    location?: string,
    teacher?: string,
    room?: string,
    restDates?: string[]       // ISO 日期数组，休息日
  }
  ```
- output: `{ id, classDates: string[] }`

### 7. update_course
部分更新一门课。仅修改传入的字段。
- input: `{ id, name?, subject?, className?, startDate?, endDate?, startTime?, endTime?, location?, teacher?, room?, restDates? }`
- output: `Course & { classDates }`

### 8. remove_course
删除一门课。
- input: `{ id }`
- output: `{ removed: true }`

### 9. list_subjects
列出全部科目（内置 + 自定义）。内置科目：物理 / 化学 / 数学 / 英语 / 语文 / 其他。
- input: `{}`
- output: `{ subjects: [{ name, color, builtIn }] }`

### 10. add_subject
新建自定义科目。
- input: `{ name, color? }`
- output: `Subject`

### 11. update_subject
更新一个科目。改名会级联到所有引用此科目的课程。内置科目不可改名（仅能改色）。
- input: `{ name, newName?, color? }`
- output: `Subject & { cascadeCount }`

### 12. remove_subject
删除自定义科目。若仍有课程引用则拒绝删除。
- input: `{ name }`
- output: `{ removed: true }`

### 13. get_schedule
返回某日期区间内展开后的排课表——每个上课日一条记录。
- input: `{ studentId?, from: YYYY-MM-DD, to: YYYY-MM-DD }`
- output:
  ```ts
  { items: [{
    date, studentId, courseId, name, subject,
    startTime, endTime, location, teacher, room,
    status: 'active' | 'upcoming' | 'done'
  }] }
  ```

### 14. export_calendar
使用无头浏览器（Puppeteer）把某学生的月历渲染为 PNG 文件。Web 界面以 `?export=1&student=<id>&month=YYYY-MM` 加载，因此渲染逻辑与交互视图一致。进程内启动一个嵌入 HTTP 服务（随机本地端口）以提供数据，渲染完毕后销毁。
- input: `{ studentId, month?: YYYY-MM, outputPath?: string }`
- output: `{ path, studentId, month, studentName, dataPath }`
- 默认值：`month` → `data.currentMonth`；`outputPath` → `./juan-schedule-<name>-<month>.png`
- HTTP 等价：`GET /api/export.png?student=<id>&month=YYYY-MM` 返回 PNG 字节，并附带 `Content-Disposition` 文件名。
- 环境变量覆盖：`PUPPETEER_EXECUTABLE_PATH` 可指定使用系统已有的 Chrome/Chromium 而非自带的。

## CLI 用法

每个工具都对应一套 CLI 子命令，方便人用：

```bash
juan-schedule init                                          # 写入示例数据
juan-schedule web --port 3737                               # 启动 Web 服务
juan-schedule student list                                  # 所有学生
juan-schedule student add -n "Alex" -c "#4f8ef7"
juan-schedule course add -s stu_xxx -n "Physics" --start-date 2026-07-12 \
  --end-date 2026-07-28 --start-time 08:30 --subject 物理
juan-schedule schedule get --from 2026-07-12 --to 2026-07-31 --student stu_xxx --json
juan-schedule export png -s stu_xxx -m 2026-07 -o ./out.png  # 无头 PNG 渲染
juan-schedule lang en
juan-schedule import --from backup.json
```

所有命令都支持 `--json` 输出机器可读格式（推荐 Agent 使用）。

## 数据文件

默认：`~/.juan-schedule/data.json`（可用 `JUAN_SCHEDULE_HOME` 环境变量覆盖）。原子写（先 `.tmp` 再 rename）防止半写损坏。

## Web 界面

`index.html` 中的 Web 界面有两种运行方式：
1. **离线** —— 双击 `index.html`；数据存于 `localStorage`；无需服务。
2. **在线** —— 运行 `juan-schedule web`，打开 `http://localhost:3737`；数据存于 JSON 文件，与 CLI / Agent 共享。

Web 界面启动时自动探测本地服务。若可达，所有写入走 HTTP；否则回退到 `localStorage`。设置面板中的"上传到本地服务"按钮可把 localStorage 数据一次性推送到 JSON 文件。

## 国际化

- 界面：可在 `zh`（默认）与 `en` 之间切换。Web 端在设置抽屉，CLI 端用 `juan-schedule lang en`。
- 工具描述与 schema：固定英文（让 Agent 始终面对同一份契约）。
- 内置科目名与种子数据中的学生名：作为数据看待，不参与本地化。