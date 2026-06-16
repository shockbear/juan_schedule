# juan-schedule · 卷王多人培训课程管理

为多个学生管理培训课程——日历、排课表、PNG 导出——支持 Web 界面、命令行、以及 AI Agent 工具调用。Web、CLI、Agent 共用同一份 JSON 数据文件。

## 功能特性

- **多人管理** —— 想管多少学生就管多少
- **日历看板** —— 周一开头的月视图，状态筛选（全部 / 进行中 / 未开始 / 已结束）
- **智能排课** —— 每天 / 仅工作日 / 上五休一 / 上六休一，或自定义任意休息日模式
- **自定义科目** —— 内置 物理 / 化学 / 数学 / 英语 / 语文 / 其他，亦可自行添加
- **PNG 导出** —— 通过 Puppeteer 无头渲染，方便把干净的日历图分享给家人或老师（CLI：`juan-schedule export png -s <id> -m 2026-07 -o out.png`）
- **AI Agent 友好** —— 14 个工具（`list_students`、`add_course`、`get_schedule` 等），兼容 OpenClaw 风格的 Agent 直接调用
- **国际化** —— 界面中文 / English 切换；工具描述固定英文
- **无需构建** —— 纯 Node，不依赖打包器；装上即用
- **原子写入** —— 即使进程被强杀，也不会留下半损坏的 JSON
<img width="1920" height="989" alt="image" src="https://github.com/user-attachments/assets/92f65a97-b801-48f3-9377-0ec03b9b18f1" />
<img width="1418" height="1380" alt="秦若宁_2026-07_课表 (1)" src="https://github.com/user-attachments/assets/f20b26a3-2124-4259-be0f-4319a5151e2a" />
<img width="1772" height="704" alt="秦若宁_课程列表 (1)" src="https://github.com/user-attachments/assets/34030f0f-8e87-44a1-a0f7-76ac32d2ec7f" />


## 快速开始

```bash
# 1. 安装（本地克隆，无需发布）
npm install

# 2. 写入示例数据
npx juan-schedule init

# 3. 打开 Web 界面
npx juan-schedule web
# → http://127.0.0.1:3737
```

或者直接双击 `index.html` 在浏览器中打开——会进入离线模式，使用 `localStorage` 存储；启动服务器后会自动识别并切换到 HTTP 模式。

> **注意**：`npm install` 会保持轻量——[Puppeteer](https://pptr.dev/)（会自下载约 200 MB 的 Chromium）是**可选**依赖，只有 `export png` 命令才需要。其他命令（init / web / student / course / subject / schedule）无需 Puppeteer 即可工作。
>
> 如需启用 PNG 导出，请运行：`npm install puppeteer`（或将系统已装的 Chrome/Chromium 路径设到 `PUPPETEER_EXECUTABLE_PATH` 后 `npm install puppeteer-core`）。

## 命令行

```bash
juan-schedule init                                          # 写入示例数据
juan-schedule web [--port 3737] [--host 127.0.0.1]          # 启动 Web 服务
juan-schedule student list|add|update|remove                # 管理学生
juan-schedule course  list|add|update|remove                # 管理课程
juan-schedule subject list|add|update|remove                # 管理科目
juan-schedule schedule get --from YYYY-MM-DD --to YYYY-MM-DD [--student ID]   # 展开后的排课表
juan-schedule export png -s <id> -m 2026-07 -o out.png   # 无头 PNG 渲染（Puppeteer）
juan-schedule import --from <file.json>                     # 导入 JSON 备份
juan-schedule lang zh|en                                    # 切换 CLI/界面语言
juan-schedule config [--get key] [--set key=value]          # 读写配置
juan-schedule version

# 所有命令都支持 --json，输出机器可读的格式。
juan-schedule course list --json
juan-schedule schedule get --from 2026-07-12 --to 2026-07-31 --json
```

### 示例

```bash
# 添加一门课程
juan-schedule course add \
  --student stu_abc123 \
  --name "蓝天物理-2026暑假1期" \
  --subject 物理 \
  --class "P9-LH4" \
  --start-date 2026-07-12 \
  --end-date 2026-07-28 \
  --start-time 08:30 \
  --end-time 11:00 \
  --location "市中心校区" \
  --teacher "李老师" \
  --room "605" \
  --rest-dates "2026-07-12,2026-07-19,2026-07-26"

# 查询排课表
juan-schedule schedule get --from 2026-07-12 --to 2026-07-31 --student stu_abc123

# 切换 CLI 至英文
juan-schedule lang en
```

## Web 界面

`index.html` 中的 Web 界面支持两种运行模式：

1. **离线（无服务）** —— 直接双击 `index.html`；数据存于 `localStorage`。所有功能可用；不与 CLI 共享。
2. **在线（运行 `juan-schedule web` 后）** —— 界面自动识别本地服务并切换至 HTTP。数据通过 JSON 文件与 CLI/Agent 共享。设置面板中的"上传到本地服务"按钮会把 localStorage 数据推送到 JSON 文件。

Web 界面是单文件自包含 HTML，内嵌 CSS 与 JS——应用本身不依赖 CDN（仅 PNG 导出时按需加载 html2canvas）。

## AI Agent 集成

本 Skill 暴露 14 个工具供任意兼容 OpenClaw 的 Agent 调用。完整 schema 见 [`SKILL.md`](./SKILL.md)。

Agent 的"自然"使用方式：

```text
User: "帮 Alex 加一门物理课，7月12日到28日，8:30到11:00"
Agent:
  1. list_students        → 找到 Alex 的 studentId
  2. list_subjects        → 确认 "物理" 存在
  3. add_course           → 创建课程，返回 classDates

User: "Alex 下周一下午有什么课？"
Agent:
  1. list_students        → 找到 Alex 的 studentId
  2. get_schedule         → 返回展开后的列表，Agent 自己过滤
```

所有工具都对应一套 CLI 子命令，可以先在终端调试，再让 Agent 调用。

## 数据文件

默认位置：`~/.juan-schedule/data.json`（跨平台）。可通过环境变量 `JUAN_SCHEDULE_HOME` 覆盖。

写入是原子的：先写 `data.json.tmp`，再 rename。文件被损坏时自动备份为 `data.json.bak.<timestamp>` 并用一份全新的种子数据替换。

## 项目目录结构

```
.
├── index.html                # Web 界面（单文件，内嵌 CSS+JS）
├── package.json              # name=juan-schedule, bin 指向 src/cli.js
├── manifest.json             # Skill 元数据
├── SKILL.md                  # Agent 工具文档
├── README.md
├── LICENSE                   # MIT
└── src/
    ├── cli.js                # CLI 入口（commander）
    ├── server.js             # HTTP 服务：静态资源 + REST API
    ├── store.js              # JSON 存储（原子 load/save/update）
    ├── export-png.js         # 无头 PNG 导出（Puppeteer）
    ├── seed.js               # 示例数据构造器
    ├── i18n/
    │   ├── index.js          # t() 帮助函数
    │   ├── zh.json
    │   └── en.json
    ├── models/
    │   ├── student.js
    │   ├── course.js         # generateClassDates, validate, presets
    │   └── subject.js        # 内置 + 自定义，级联改名
    ├── tools/                # 14 个 Agent 工具（每个一个文件）
    │   ├── index.js
    │   ├── list_students.js
    │   ├── add_student.js
    │   ├── update_student.js
    │   ├── remove_student.js
    │   ├── list_courses.js
    │   ├── add_course.js
    │   ├── update_course.js
    │   ├── remove_course.js
    │   ├── list_subjects.js
    │   ├── add_subject.js
    │   ├── update_subject.js
    │   ├── remove_subject.js
    │   ├── get_schedule.js
    │   └── export_calendar.js
    └── util/
        ├── date.js           # parseISO, toISO, fmtDate*, countRangeDays, 等
        ├── id.js             # genId(prefix)
        └── path.js           # 数据目录解析
```

## 从旧版纯 Web 版迁移

如果已有使用 `localStorage` 的 `index.html`：

1. 打开 Web 界面 → 设置 → "导出数据" → 保存 JSON
2. `npm install`（在仓库目录）
3. `npx juan-schedule init`
4. `npx juan-schedule import --from /path/to/exported.json`
5. 此后数据就存放在 `~/.juan-schedule/data.json` 了

## 许可协议

MIT
