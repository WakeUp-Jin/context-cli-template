# context-cli

CLI tool to scaffold context-template-cli projects - 快速创建基于上下文工程的 LLM 应用开发项目

[![npm version](https://img.shields.io/npm/v/context-cli.svg)](https://www.npmjs.com/package/context-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 特性

- 🚀 **快速启动** - 一分钟内创建完整的 LLM 应用项目
- 🎨 **现代 CLI** - 使用 @clack/prompts 提供优雅的交互体验
- 📦 **多包管理器** - 支持 bun、pnpm、npm
- 🔧 **完整工具链** - 预配置 TypeScript、Vitest、ESLint
- 🤖 **LLM 集成** - 内置 DeepSeek API 支持，可扩展其他提供商
- 🧠 **上下文管理** - 6 种上下文类型管理系统
- 🛠️ **工具系统** - 可扩展的工具调用框架
- 🧪 **测试评估** - 完整的测试和评估系统

## 安装

```bash
# 使用 npm
npm install -g context-cli

# 使用 pnpm
pnpm add -g context-cli

# 使用 bun
bun add -g context-cli
```

## 使用

创建新项目：

```bash
context-cli
# 或
create-context-app
```

然后按照提示操作：

1. **输入项目名称**（例如：my-ai-app）
2. **选择包管理器**（bun / pnpm / npm）
3. **选择是否立即安装依赖**

## 快速开始

创建项目后：

```bash
# 进入项目目录
cd my-ai-app

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 DEEPSEEK_API_KEY

# 运行示例
npm run dev          # 简单对话示例
npm run dev:tool     # 工具调用示例

# 运行测试
npm run test

# 构建项目
npm run build
```

## 项目结构

生成的项目包含以下模块：

```
my-ai-app/
├── llm/                    # LLM 服务层
│   ├── services/          # LLM 提供商实现（DeepSeek）
│   ├── utils/             # 工具函数（executeToolLoop）
│   └── factory.ts         # LLM 服务工厂
├── context/                # 上下文管理系统
│   ├── modules/           # 6 种上下文模块
│   └── ContextManager.ts  # 统一管理器
├── tool/                   # 工具管理系统
│   ├── FileReadTool/      # 文件读取工具
│   ├── GrepTool/          # 正则搜索工具
│   └── ToolManager.ts     # 工具管理器
├── agent/                  # Agent 编排（预留）
├── evaluationTemplate/     # 测试评估系统
├── utils/                  # 工具函数
│   └── logger.ts          # 日志工具
├── config/                 # 配置管理
│   └── env.ts             # 环境变量加载
└── examples/               # 使用示例
    ├── simple-chat.ts     # 简单对话
    └── tool-calling.ts    # 工具调用
```

## 核心功能

### 1. LLM 服务层

- ✅ DeepSeek API 集成
- ✅ 工具调用支持
- ✅ 流式响应
- 🔮 多提供商支持（OpenAI、Anthropic 等）

### 2. 上下文管理

6 种上下文类型：
- **Conversation** - 会话历史
- **Tool** - 工具调用记录
- **Memory** - 用户记忆
- **SystemPrompt** - 系统提示词
- **StructuredOutput** - 结构化输出
- **RelevantContext** - 相关上下文

### 3. 工具系统

内置工具：
- **FileReadTool** - 读取文件内容
- **GrepTool** - 正则表达式搜索

易于扩展，支持自定义工具。

### 4. 评估系统

- EventBus 事件收集
- Agent 行为评估
- 工具调用追踪

## 示例代码

### 简单对话

```typescript
import { createLLMService } from './llm/index.js';
import { loadEnv } from './config/env.js';

loadEnv();

const service = await createLLMService({
  provider: 'deepseek',
  model: 'deepseek-chat',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const response = await service.simpleChat(
  'Hello! Can you introduce yourself?',
  'You are a helpful AI assistant.'
);

console.log('Assistant:', response);
```

### 工具调用

```typescript
import { createLLMService } from './llm/index.js';
import { ContextManager } from './context/index.js';
import { ToolManager } from './tool/index.js';

// 初始化上下文和工具
const contextManager = new ContextManager();
await contextManager.init();

const toolManager = new ToolManager();

// 创建 LLM 服务
const service = await createLLMService({
  provider: 'deepseek',
  model: 'deepseek-chat',
  apiKey: process.env.DEEPSEEK_API_KEY,
}, toolManager);

// 调用 LLM
const messages = contextManager.getFormattedContext();
const tools = toolManager.getTools();
const response = await service.complete(messages, tools);
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/context-cli.git
cd context-cli

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 本地测试
npm link
context-cli
```

## 文档

- [实施计划](./docs/implementation-plan.md) - 详细的架构设计和实施步骤
- [API 文档](#) - API 参考文档
- [贡献指南](#) - 如何贡献代码

## 技术栈

- **TypeScript** - 类型安全的 JavaScript
- **@clack/prompts** - 现代化的 CLI 交互框架
- **fs-extra** - 增强的文件系统操作
- **execa** - 更好的子进程执行
- **OpenAI SDK** - LLM API 调用（兼容 DeepSeek）
- **Vitest** - 快速的单元测试框架

## 路线图

### v1.0 - 核心功能 ✅
- [x] CLI 交互界面
- [x] 包管理器选择
- [x] 项目模板生成
- [x] 配置文件生成
- [x] 依赖自动安装

### v1.1 - 增强功能 🔮
- [ ] 模板类型选择（full/minimal）
- [ ] 更详细的进度提示
- [ ] 错误恢复机制

### v2.0 - 扩展功能 🔮
- [ ] Web 服务器集成（Hono/Koa/Express）
- [ ] 多 LLM 提供商支持
- [ ] 插件系统
- [ ] 项目模板市场

## 贡献

欢迎贡献！请查看 [贡献指南](#) 了解如何参与项目开发。

## 许可证

[MIT](./LICENSE)

## 致谢

感谢所有为这个项目做出贡献的开发者！

---

Made with ❤️ by the Context-CLI Team
