# context-cli 脚手架工具实现计划

## 项目概述

创建一个名为 `context-cli` 的脚手架工具，用于快速初始化基于 context-template-cli 的 LLM 应用项目。

**核心功能**：
- 使用 `@clack/prompts` 提供现代化的 CLI 交互体验
- 支持包管理器选择（bun/pnpm/npm）
- 自动生成项目配置文件
- 复制完整的模板代码
- 支持依赖自动安装
- 预留扩展接口（Web 服务器、模板类型等）

---

## 实施步骤

### 阶段 1：创建脚手架项目结构

#### 1.1 初始化脚手架项目

在新目录创建脚手架项目：

```bash
mkdir context-cli
cd context-cli
npm init -y
```

#### 1.2 创建目录结构

```
context-cli/
├── src/
│   ├── index.ts                 # 主入口
│   ├── prompts.ts              # CLI 交互
│   ├── types.ts                # 类型定义
│   ├── templates/              # 配置文件生成器
│   │   ├── packageJson.ts
│   │   ├── tsconfig.ts
│   │   ├── gitignore.ts
│   │   ├── envExample.ts
│   │   └── vitestConfig.ts
│   └── utils/                  # 工具函数
│       ├── fileSystem.ts
│       ├── packageManager.ts
│       └── logger.ts
├── bin/
│   └── index.js                # CLI 入口（shebang）
└── template/                   # 模板文件目录
```

### 阶段 2：实现核心功能

#### 2.1 创建类型定义（src/types.ts）

```typescript
export interface ProjectConfig {
  projectName: string;
  packageManager: PackageManager;
  shouldInstall: boolean;

  // 预留扩展字段
  templateType?: 'full' | 'minimal';
  webServer?: 'none' | 'hono' | 'koa' | 'express';
}

export type PackageManager = 'bun' | 'pnpm' | 'npm';
```

#### 2.2 实现 CLI 交互（src/prompts.ts）

使用 `@clack/prompts` 实现交互式提示：

```typescript
import * as p from '@clack/prompts';

export async function collectProjectInfo(): Promise<ProjectConfig> {
  p.intro('🚀 Create Context-Template-CLI Project');

  // 1. 项目名称
  const projectName = await p.text({
    message: 'Project name:',
    placeholder: 'my-llm-app',
    validate: (value) => {
      if (!value) return 'Project name is required';
      if (!/^[a-z0-9-_]+$/.test(value)) {
        return 'Project name must contain only lowercase letters, numbers, hyphens, and underscores';
      }
    },
  });

  // 2. 包管理器选择
  const packageManager = await p.select({
    message: 'Select a package manager:',
    options: [
      { value: 'bun', label: 'Bun (Fast, modern)' },
      { value: 'pnpm', label: 'pnpm (Efficient)' },
      { value: 'npm', label: 'npm (Standard)' },
    ],
  });

  // 3. 是否安装依赖
  const shouldInstall = await p.confirm({
    message: 'Install dependencies now?',
    initialValue: true,
  });

  return { projectName, packageManager, shouldInstall };
}
```

#### 2.3 实现主逻辑（src/index.ts）

```typescript
import { collectProjectInfo } from './prompts';
import * as p from '@clack/prompts';

async function main() {
  try {
    // 1. 收集配置
    const config = await collectProjectInfo();

    // 2. 创建项目目录
    const spinner = p.spinner();
    spinner.start('Creating project...');
    await createProjectDirectory(config);
    spinner.stop('Project created!');

    // 3. 生成配置文件
    spinner.start('Generating configuration files...');
    await generateConfigFiles(config);
    spinner.stop('Configuration files generated!');

    // 4. 复制模板文件
    spinner.start('Copying template files...');
    await copyTemplateFiles(config);
    spinner.stop('Template files copied!');

    // 5. 安装依赖
    if (config.shouldInstall) {
      spinner.start(`Installing dependencies with ${config.packageManager}...`);
      await installDependencies(config);
      spinner.stop('Dependencies installed!');
    }

    // 6. 完成提示
    p.outro(`✅ Success! Created ${config.projectName}`);
  } catch (error) {
    p.cancel(`Error: ${error.message}`);
    process.exit(1);
  }
}
```

#### 2.4 实现文件系统工具（src/utils/fileSystem.ts）

```typescript
import fs from 'fs-extra';
import path from 'path';

export async function createProjectDirectory(config: ProjectConfig): Promise<void> {
  const targetDir = path.join(process.cwd(), config.projectName);

  if (await fs.pathExists(targetDir)) {
    throw new Error(`Directory ${config.projectName} already exists`);
  }

  await fs.ensureDir(targetDir);
}

export async function copyTemplateFiles(config: ProjectConfig): Promise<void> {
  const templateDir = path.join(__dirname, '../../template');
  const targetDir = path.join(process.cwd(), config.projectName);

  const dirs = ['llm', 'context', 'tool', 'agent', 'evaluationTemplate', 'utils', 'config', 'examples'];

  for (const dir of dirs) {
    const srcPath = path.join(templateDir, dir);
    const destPath = path.join(targetDir, dir);

    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }
}
```

#### 2.5 实现包管理器工具（src/utils/packageManager.ts）

```typescript
import { execa } from 'execa';

export async function installDependencies(config: ProjectConfig): Promise<void> {
  const cwd = path.join(process.cwd(), config.projectName);

  switch (config.packageManager) {
    case 'bun':
      await execa('bun', ['install'], { cwd });
      break;
    case 'pnpm':
      await execa('pnpm', ['install'], { cwd });
      break;
    case 'npm':
      await execa('npm', ['install'], { cwd });
      break;
  }
}

export function getRunCommand(packageManager: string): string {
  switch (packageManager) {
    case 'bun': return 'bun run';
    case 'pnpm': return 'pnpm';
    case 'npm': return 'npm run';
    default: return 'npm run';
  }
}
```

### 阶段 3：创建配置文件生成器

#### 3.1 package.json 生成（src/templates/packageJson.ts）

```typescript
export function generatePackageJson(config: ProjectConfig): object {
  return {
    name: config.projectName,
    version: '0.1.0',
    type: 'module',
    description: 'LLM application built with context-template-cli',
    scripts: {
      'dev': 'tsx watch examples/simple-chat.ts',
      'dev:tool': 'tsx watch examples/tool-calling.ts',
      'build': 'tsc',
      'test': 'vitest run',
      'test:watch': 'vitest',
      'eval': 'tsx evaluationTemplate/example.ts',
    },
    dependencies: {
      'openai': '^4.70.4',
    },
    devDependencies: {
      '@types/node': '^22.10.1',
      'tsx': '^4.19.2',
      'typescript': '^5.7.2',
      'vitest': '^2.1.8',
      '@vitest/ui': '^2.1.8',
    },
    engines: {
      node: '>=18.0.0',
    },
  };
}
```

#### 3.2 tsconfig.json 生成（src/templates/tsconfig.ts）

```typescript
export function generateTsConfig(): object {
  return {
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'node',
      outDir: './dist',
      rootDir: './',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
    },
    include: ['llm/**/*', 'context/**/*', 'tool/**/*', 'agent/**/*', 'evaluationTemplate/**/*', 'utils/**/*', 'config/**/*', 'examples/**/*'],
    exclude: ['node_modules', 'dist', '**/*.test.ts'],
  };
}
```

#### 3.3 其他配置文件生成器

- `.gitignore`：包含 node_modules、dist、.env 等
- `.env.example`：环境变量模板（DEEPSEEK_API_KEY 等）
- `vitest.config.ts`：测试配置

### 阶段 4：准备模板文件

#### 4.1 复制现有代码到 template/ 目录

从 `/Users/xjk/Desktop/ScriptCode/context-template-cli/` 复制以下目录：
- `llm/` → `template/llm/`
- `context/` → `template/context/`
- `tool/` → `template/tool/`
- `agent/` → `template/agent/`
- `evaluationTemplate/` → `template/evaluationTemplate/`

#### 4.2 创建补充文件

**template/utils/logger.ts**：
```typescript
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  debug(...args: any[]) { console.log('[DEBUG]', ...args); }
  info(...args: any[]) { console.log('[INFO]', ...args); }
  warn(...args: any[]) { console.warn('[WARN]', ...args); }
  error(...args: any[]) { console.error('[ERROR]', ...args); }
}

export const logger = new Logger();
```

**template/config/env.ts**：
```typescript
import * as fs from 'fs';
import * as path from 'path';

export function loadEnv(environment?: string) {
  const envFile = environment ? `.env.${environment}` : '.env';
  const envPath = path.join(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  Warning: ${envFile} not found`);
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...values] = trimmed.split('=');
    const value = values.join('=').trim().replace(/^["'](.*)["']$/, '$1');
    process.env[key.trim()] = value;
  }
}
```

**template/examples/simple-chat.ts**：
```typescript
import { createLLMService } from '../llm/index.js';
import { loadEnv } from '../config/env.js';

loadEnv();

async function main() {
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
}

main().catch(console.error);
```

**template/examples/tool-calling.ts**：
完整的工具调用示例（见详细方案）

#### 4.3 创建 README 模板

**template/README.md**：
```markdown
# {{PROJECT_NAME}}

LLM application built with context-template-cli

## Quick Start

1. Install dependencies: `{{PACKAGE_MANAGER}} install`
2. Configure environment: `cp .env.example .env`
3. Run examples: `{{RUN_COMMAND}} dev`

## Features

- 🤖 LLM Service Layer (DeepSeek API)
- 🧠 Context Management (6 types)
- 🛠️ Tool System (FileReadTool, GrepTool)
- 🎯 Agent Framework (reserved)
- 🧪 Evaluation System
```

### 阶段 5：配置脚手架工具本身

#### 5.1 创建 bin/index.js

```javascript
#!/usr/bin/env node

import('../dist/index.js').catch((err) => {
  console.error('Failed to load CLI:', err);
  process.exit(1);
});
```

#### 5.2 配置 package.json

```json
{
  "name": "context-cli",
  "version": "1.0.0",
  "description": "CLI tool to scaffold context-template-cli projects",
  "type": "module",
  "bin": {
    "context-cli": "./bin/index.js",
    "create-context-app": "./bin/index.js"
  },
  "files": ["bin", "dist", "template"],
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@clack/prompts": "^0.11.0",
    "fs-extra": "^11.2.0",
    "execa": "^9.5.2"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "@types/fs-extra": "^11.0.4",
    "typescript": "^5.7.2",
    "tsx": "^4.19.2"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": ["cli", "scaffold", "llm", "ai", "deepseek", "context"],
  "license": "MIT"
}
```

#### 5.3 创建 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 阶段 6：测试和发布

#### 6.1 本地测试

```bash
# 在 context-cli 目录
npm install
npm run build
npm link

# 测试命令
context-cli

# 创建测试项目
cd /tmp
context-cli
# 选择项目名、包管理器等
cd my-test-app
npm run dev
```

#### 6.2 发布到 npm

```bash
# 1. 登录 npm
npm login

# 2. 确保构建完成
npm run build

# 3. 发布
npm publish --access public
```

#### 6.3 发布后验证

```bash
# 全局安装
npm install -g context-cli

# 或使用 npx
npx context-cli
```

---

## 扩展性设计

### 预留接口

在 `src/types.ts` 中预留扩展字段：

```typescript
export interface ProjectConfig {
  // ... 现有字段

  // 🔮 未来扩展
  templateType?: 'full' | 'minimal';
  webServer?: 'none' | 'hono' | 'koa' | 'express';
  llmProvider?: 'deepseek' | 'openai' | 'anthropic';
  includeTests?: boolean;
  includeExamples?: boolean;
}
```

### 未来功能

1. **模板类型选择**：
   - Full：完整功能
   - Minimal：基础设置

2. **Web 服务器集成**：
   - Hono（快速）
   - Koa
   - Express

3. **更多 LLM 提供商**：
   - OpenAI
   - Anthropic
   - Qwen

4. **插件系统**：
   - 数据库集成（Prisma）
   - 向量数据库（Pinecone）
   - 日志系统（Winston）

---

## 关键文件清单

### 需要创建的脚手架文件

```
context-cli/
├── src/
│   ├── index.ts                    ✅ 主入口
│   ├── prompts.ts                  ✅ CLI 交互
│   ├── types.ts                    ✅ 类型定义
│   ├── templates/
│   │   ├── packageJson.ts          ✅ package.json 生成
│   │   ├── tsconfig.ts             ✅ tsconfig.json 生成
│   │   ├── gitignore.ts            ✅ .gitignore 生成
│   │   ├── envExample.ts           ✅ .env.example 生成
│   │   └── vitestConfig.ts         ✅ vitest.config.ts 生成
│   └── utils/
│       ├── fileSystem.ts           ✅ 文件操作
│       ├── packageManager.ts       ✅ 包管理器操作
│       └── logger.ts               ✅ 日志工具
├── bin/
│   └── index.js                    ✅ CLI 入口
├── template/                       ✅ 模板文件目录
│   ├── llm/                        📋 从现有项目复制
│   ├── context/                    📋 从现有项目复制
│   ├── tool/                       📋 从现有项目复制
│   ├── agent/                      📋 从现有项目复制
│   ├── evaluationTemplate/         📋 从现有项目复制
│   ├── utils/
│   │   └── logger.ts               ✅ 新建
│   ├── config/
│   │   └── env.ts                  ✅ 新建
│   ├── examples/
│   │   ├── simple-chat.ts          ✅ 新建
│   │   └── tool-calling.ts         ✅ 新建
│   ├── gitignore                   ✅ .gitignore 模板
│   └── README.md                   ✅ README 模板
├── package.json                    ✅ 脚手架配置
├── tsconfig.json                   ✅ TypeScript 配置
├── README.md                       ✅ 文档
└── LICENSE                         ✅ MIT License
```

### 需要从现有项目复制的文件

从 `/Users/xjk/Desktop/ScriptCode/context-template-cli/` 复制：
- `llm/**/*`
- `context/**/*`
- `tool/**/*`
- `agent/`（空目录）
- `evaluationTemplate/**/*`

---

## 依赖清单

### 脚手架工具依赖

**生产依赖**：
- `@clack/prompts` - CLI 交互框架
- `fs-extra` - 文件系统操作
- `execa` - 执行外部命令

**开发依赖**：
- `typescript` - TypeScript 编译器
- `tsx` - TypeScript 执行器
- `@types/node` - Node 类型定义
- `@types/fs-extra` - fs-extra 类型定义

### 生成项目的依赖

**生产依赖**：
- `openai` - OpenAI SDK（兼容 DeepSeek）

**开发依赖**：
- `typescript` - TypeScript 编译器
- `tsx` - TypeScript 执行器
- `vitest` - 测试框架
- `@vitest/ui` - 测试 UI
- `@types/node` - Node 类型定义

---

## 实施优先级

### P0（必需，第一版发布）
1. ✅ CLI 交互（包管理器选择）
2. ✅ 文件复制功能
3. ✅ 配置文件生成
4. ✅ 依赖安装
5. ✅ 补充文件（logger、env、examples）

### P1（增强，后续版本）
1. 🔮 模板类型选择
2. 🔮 更详细的进度提示
3. 🔮 错误恢复机制
4. 🔮 自定义模板路径

### P2（扩展，未来功能）
1. 🔮 Web 服务器集成
2. 🔮 多 LLM 提供商支持
3. 🔮 插件系统
4. 🔮 项目模板市场

---

## 注意事项

1. **ESM 模块**：项目使用 ES Modules，所有导入需要 `.js` 扩展名
2. **文件权限**：bin/index.js 需要执行权限（chmod +x）
3. **npm 发布**：确保 .gitignore 在 template 目录中命名为 `gitignore`（避免 npm 忽略）
4. **测试充分**：发布前在不同包管理器下测试
5. **版本管理**：使用语义化版本，记录 CHANGELOG

---

## 成功标准

✅ **用户体验**：
- 清晰的交互提示
- 友好的错误信息
- 详细的完成指引

✅ **功能完整性**：
- 生成的项目可直接运行
- 所有示例代码正常工作
- 测试通过

✅ **可维护性**：
- 代码结构清晰
- 类型安全
- 易于扩展

✅ **发布质量**：
- npm 包可正常安装
- 全局命令可用
- 文档完整
