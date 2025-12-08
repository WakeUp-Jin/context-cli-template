# create-context-template

快速创建基于上下文工程的 LLM 应用开发项目 | CLI tool to scaffold LLM projects with context engineering architecture

[![npm version](https://img.shields.io/npm/v/create-context-template.svg)](https://www.npmjs.com/package/create-context-template)
[![npm downloads](https://img.shields.io/npm/dm/create-context-template.svg)](https://www.npmjs.com/package/create-context-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 📚 **相关资源**:[上下文工程实践指南](https://github.com/WakeUp-Jin/Practical-Guide-to-Context-Engineering) -深入学习上下文工程的设计理念和最佳实践

## ✨ 特性

- 🚀 **快速启动** - 一分钟内创建完整的 LLM 应用项目
- 🎨 **现代 CLI** - 使用 @clack/prompts 提供优雅的交互体验
- 📦 **多包管理器** - 支持 npm、pnpm、yarn、bun
- 🔧 **完整工具链** - 预配置 TypeScript、Vitest、ESLint
- 🤖 **LLM 集成** - 内置 DeepSeek API 支持，可扩展其他提供商
- 🧠 **上下文管理** - 6 种上下文类型管理系统
- 🛠️ **工具系统** - 可扩展的工具调用框架
- 🧪 **测试评估** - 完整的测试和评估系统
- 📚 **架构文档** - 详细的上下文工程设计文档

## 📦 使用方式

### 方式 1: npm create (推荐)

```bash
npm create context-template
```

### 方式 2: pnpm

```bash
pnpm create context-template
```

### 方式 3: yarn

```bash
yarn create context-template
```

### 方式 4: bun

```bash
bun create context-template
```

### 方式 5: npx

```bash
npx create-context-template
```

### 方式 6: 全局安装

```bash
npm install -g create-context-template
create-context-template
```

## 🎯 快速开始

### 1. 创建项目

运行命令后，按照提示操作：

1. **输入项目名称**（例如：my-ai-app）
2. **选择包管理器**（npm / pnpm / yarn / bun）
3. **选择是否立即安装依赖**

### 2. 配置环境变量

```bash
cd my-ai-app
cp .env.example .env
# 编辑 .env 文件，添加你的 DEEPSEEK_API_KEY
```

### 3. 运行示例

```bash
npm run dev          # 简单对话示例
npm run dev:tool     # 工具调用示例
```

### 4. 阅读架构文档

```bash
cat docs/架构设计\ -\ 上下文工程.md
# 或在编辑器中打开
```

**强烈建议先阅读架构文档，理解上下文工程的设计理念！**

## 📁 项目结构

生成的项目包含以下模块：

```
my-ai-app/
├── core/                    # 核心系统模块
│   ├── llm/                # LLM 服务层
│   │   ├── services/       # LLM 提供商实现（DeepSeek）
│   │   ├── utils/          # 工具函数（executeToolLoop）
│   │   └── factory.ts      # LLM 服务工厂
│   ├── context/            # 上下文管理系统
│   │   ├── modules/        # 6 种上下文模块
│   │   └── ContextManager.ts  # 统一管理器
│   ├── tool/               # 工具管理系统
│   │   ├── ReadFile/       # 文件读取工具
│   │   ├── ListFiles/      # 文件列表工具
│   │   └── ToolManager.ts  # 工具管理器
│   ├── agent/              # Agent 编排
│   │   ├── SimpleAgent.ts  # 简单 Agent 实现
│   │   └── MultiAgent.ts   # 多 Agent 编排
│   └── promptManager/      # 提示词管理
├── evaluation/             # 测试评估系统
│   ├── EventBus.ts        # 事件总线
│   ├── evaluate.ts        # 评估器
│   └── example.ts         # 评估示例
├── utils/                  # 工具函数
│   └── logger.ts          # 日志工具
├── config/                 # 配置管理
│   └── env.ts             # 环境变量加载
├── examples/               # 使用示例
│   ├── simple-chat.ts     # 简单对话
│   └── multi-chat.ts      # 多轮对话
└── docs/                   # 项目文档
    └── 架构设计 - 上下文工程.md  # 核心架构文档 ⭐
```

## 🧠 核心功能

### 1. LLM 服务层

基于 OpenAI SDK 实现的多模型支持：

- ✅ DeepSeek API 集成
- ✅ 工具调用支持（Tool Calling）
- ✅ 流式响应
- 🔮 可扩展其他提供商（OpenAI、Anthropic 等）

**核心方法:**

- `complete(messages, tools)` - 完整的 LLM 调用，支持工具
- `simpleChat(userMessage, systemPrompt)` - 简单对话
- `generate(prompt)` - 生成式调用

### 2. 上下文管理系统

基于**上下文工程**理念的 6 种上下文类型：

| 上下文类型                     | 说明         | 用途             |
| ------------------------------ | ------------ | ---------------- |
| **ConversationContext**        | 会话历史记录 | 维护对话连续性   |
| **ToolMessageSequenceContext** | 工具调用序列 | 追踪工具使用历史 |
| **MemoryContext**              | 用户记忆     | 长期记忆存储     |
| **SystemPromptContext**        | 系统提示词   | 定义 AI 行为     |
| **StructuredOutputContext**    | 结构化输出   | JSON 格式化输出  |
| **RelevantContext**            | 相关上下文   | 动态相关信息     |

### 3. 工具系统

可扩展的工具调用框架：

**内置工具:**

- **ReadFileTool** - 读取文件内容
- **ListFilesTool** - 列出目录文件

**工具定义规范:**

- 标准化的工具接口
- JSON Schema 参数定义
- 权限控制和并发安全
- 工具执行上下文

### 4. Agent 框架

**SimpleAgent**: 单一 Agent 实现
**MultiAgent**: 多 Agent 协作编排（预留扩展）

### 5. 评估系统

基于 EventBus 的测试评估框架：

- 事件收集和追踪
- Agent 行为评估
- 工具调用分析
- 自定义评估指标

## 💡 设计理念

### 上下文工程 (Context Engineering)

本项目基于**上下文工程**的设计理念：

> **核心**: LLM 模型是应用的关键核心
> **重心**: 开发重心在上下文的获取和编排
> **优势**: 随着模型能力提升，应用效果自动提升；同时充分发挥开发者的创造力

**核心思想:**

1. **LLM 是核心** - 保证核心是 LLM，随着模型能力提升，Agent 效果自动变好
2. **开发重心是上下文** - 极大发挥应用开发者的能力和创造力
3. **统一上下文管理** - 将所有上下文统一管理，LLM 直接与上下文交互

详细的架构设计请参考生成项目中的 `docs/架构设计 - 上下文工程.md`

## 📝 示例代码

### 简单对话

```typescript
import { createLLMService } from "./core/llm/index.js";
import { loadEnv } from "./config/env.js";

loadEnv();

const service = await createLLMService({
  provider: "deepseek",
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const response = await service.simpleChat(
  "Hello! Can you introduce yourself?",
  "You are a helpful AI assistant."
);

console.log("Assistant:", response);
```

### 工具调用

```typescript
import { createLLMService } from "./core/llm/index.js";
import { ContextManager } from "./core/context/index.js";
import { ToolManager } from "./core/tool/index.js";

// 初始化上下文和工具
const contextManager = new ContextManager();
await contextManager.init();

const toolManager = new ToolManager();

// 创建 LLM 服务
const service = await createLLMService(
  {
    provider: "deepseek",
    model: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  toolManager
);

// 使用 generate 方法自动处理工具调用
const answer = await service.generate(
  "请帮我读取 package.json 文件，并告诉我项目名称是什么"
);

console.log(answer);
```

## 🛠️ 开发

### 克隆本仓库

```bash
git clone https://github.com/WakeUp-Jin/context-cli-template.git
cd context-cli-template
```

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
# 开发模式运行
npm run dev

# 构建
npm run build

# 本地测试
npm link
create-context-template
```

### 发布新版本

```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 发布到 npm
npm publish
```

## 📚 技术栈

- **TypeScript** - 类型安全的 JavaScript
- **@clack/prompts** - 现代化的 CLI 交互框架
- **fs-extra** - 增强的文件系统操作
- **execa** - 更好的子进程执行
- **OpenAI SDK** - LLM API 调用（兼容 DeepSeek）
- **Vitest** - 快速的单元测试框架

## 🗺️ 路线图

### v1.0 - 核心功能 ✅

- [x] CLI 交互界面
- [x] 多包管理器支持
- [x] 项目模板生成
- [x] 配置文件生成
- [x] 依赖自动安装
- [x] 架构文档集成

### v1.1 - 增强功能 🚧

- [ ] 模板类型选择（full/minimal）
- [ ] 更多 LLM 提供商模板
- [ ] 更详细的进度提示
- [ ] 错误恢复机制

### v2.0 - 扩展功能 🔮

- [ ] Web 服务器集成（Hono/Koa/Express）
- [ ] 插件系统
- [ ] 项目模板市场
- [ ] GUI 配置工具

## 🤝 贡献

欢迎贡献！如果你有任何建议或发现问题，请：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

[MIT](./LICENSE)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**Made with ❤️ by WakeUp-Jin**

如果这个项目对你有帮助，请给个 ⭐️ 吧！
