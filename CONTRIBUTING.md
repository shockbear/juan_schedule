# 为 juan-schedule 贡献

感谢你有兴趣改进 `juan-schedule`！无论是一份 Bug 报告、一个功能想法，还是一段代码改动，本项目都足够小，你几分钟就能上手。

## 开发环境搭建

```bash
git clone https://github.com/shockbear/juan_schedule
cd juan-schedule
npm install                    # 核心依赖（仅 commander）
npm install puppeteer          # 可选：用于无头 PNG 导出
npm test                       # 运行冒烟测试
```

冒烟测试会写入一个临时目录（由 `JUAN_SCHEDULE_HOME` 控制），绝不会污染你的真实数据。

## 目录结构

```
src/
  cli.js          CLI 入口，命令路由
  server.js       HTTP 服务 + REST API
  store.js        JSON 存储（原子 load/save/update）
  export-png.js   基于 Puppeteer 的无头 PNG 导出
  seed.js         示例数据构造器
  i18n/           zh.json, en.json
  models/         Student / Course / Subject 校验与逻辑
  tools/          14 个 Agent 可调用的工具（每文件一个）
  util/           日期 / id / 路径 帮助函数
index.html        Web 界面（单文件自包含）
SKILL.md          OpenClaw / Agent 工具清单
manifest.json     Skill 元数据
test/smoke.js     端到端冒烟测试
```

## 代码风格

- **CommonJS**（`require` / `module.exports`）—— 不使用 ESM，这样 CLI 在原生 Node 上可直接跑，无需 `--experimental-vm-modules`。
- 2 空格缩进，单引号；分号后不换行。
- 新增的界面字符串必须**同时**写入 `src/i18n/zh.json` 和 `src/i18n/en.json`。Web 界面内嵌的 `I18N` 对象（在 `index.html` 里）也必须同步更新。
- 工具 schema 的字段名与描述使用**英文**（面向 Agent）；工具的错误消息可用 `i18n.t()` 本地化（供人用 CLI 时阅读）。
- 若修改了某个工具的输入/输出结构，记得同步更新 `SKILL.md`，若新增了工具也需更新 `src/tools/index.js`。

## 测试

项目仅有一个冒烟测试（`test/smoke.js`），覆盖 init / CRUD / 排课 / 科目级联 / PNG 导出 / i18n。开 PR 前请运行：

```bash
npm test
```

它会写入临时目录，全部通过则退出码为 0。新增行为时请补一条对应的测试用例。

## 反馈 Bug

在 GitHub 上提 Issue，并附上：

1. 你执行的完整命令（或在 Web 界面点击了哪里）。
2. 实际输出（或截图）。
3. 你的 `node -v` 和 `npm -v`。
4. 如可复现，请贴出 `~/.juan-schedule/data.json` 内容（去掉课程名、老师名等个人数据后）。

## 许可协议

提交贡献即表示你同意你的代码将按本项目的 MIT 协议授权。