#!/usr/bin/env node
/**
 * context-cli 主入口
 */
import * as p from '@clack/prompts';
import path from 'path';
import fs from 'fs-extra';
import { collectProjectInfo } from './prompts.js';
import { createProjectDirectory, copyTemplateFiles, writeFileWithVariables } from './utils/fileSystem.js';
import { installDependencies, getRunCommand, getInstallCommand } from './utils/packageManager.js';
import { generatePackageJson } from './templates/packageJson.js';
import { generateTsConfig } from './templates/tsconfig.js';
import { generateGitignore } from './templates/gitignore.js';
import { generateEnvExample } from './templates/envExample.js';
import { generateVitestConfig } from './templates/vitestConfig.js';

async function generateConfigFiles(config: any): Promise<void> {
  const targetDir = path.join(process.cwd(), config.projectName);

  // 生成 package.json
  const packageJson = generatePackageJson(config);
  await fs.writeJSON(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });

  // 生成 tsconfig.json
  const tsConfig = generateTsConfig();
  await fs.writeJSON(path.join(targetDir, 'tsconfig.json'), tsConfig, { spaces: 2 });

  // 生成 .gitignore
  const gitignore = generateGitignore();
  await fs.writeFile(path.join(targetDir, '.gitignore'), gitignore, 'utf-8');

  // 生成 .env.example
  const envExample = generateEnvExample();
  await fs.writeFile(path.join(targetDir, '.env.example'), envExample, 'utf-8');

  // 生成 vitest.config.ts
  const vitestConfig = generateVitestConfig();
  await fs.writeFile(path.join(targetDir, 'vitest.config.ts'), vitestConfig, 'utf-8');

  // 生成 README.md (带变量替换)
  const readmeTemplate = `# {{PROJECT_NAME}}

基于 [context-template-cli](https://github.com/yourusername/context-template-cli) 构建的 LLM 应用项目

## 核心特性

- 🤖 **LLM 服务层**: 集成 DeepSeek API,支持工具调用
- 🧠 **上下文管理**: 6 种上下文类型(会话历史、工具序列、记忆、系统提示词、结构化输出、相关上下文)
- 🛠️ **工具系统**: 内置文件读取和 Grep 工具,支持扩展自定义工具
- 🎯 **Agent 框架**: 预留 Agent 编排能力,支持自定义实现
- 🧪 **评估系统**: 基于 EventBus 的测试和评估模板

## 快速开始

### 1. 安装依赖

\`\`\`bash
{{INSTALL_COMMAND}}
\`\`\`

### 2. 配置环境变量

\`\`\`bash
cp .env.example .env
# 编辑 .env 文件,添加你的 DEEPSEEK_API_KEY
\`\`\`

### 3. 运行示例

\`\`\`bash
# 简单对话示例
{{RUN_COMMAND}} dev

# 工具调用示例
{{RUN_COMMAND}} dev:tool
\`\`\`

## 项目结构

\`\`\`
.
├── core/                   # 核心系统模块
│   ├── llm/               # LLM 服务层(多模型支持)
│   ├── context/           # 上下文管理系统
│   ├── tool/              # 工具管理系统
│   ├── agent/             # Agent 编排(预留)
│   └── promptManager/     # 提示词管理
├── evaluation/            # 测试与评估
├── utils/                 # 工具函数(日志等)
├── config/                # 配置(环境变量加载)
├── examples/              # 使用示例
└── docs/                  # 项目文档
    └── ARCHITECTURE.md    # 架构设计文档(必读!)
\`\`\`

## 可用脚本

- \`{{RUN_COMMAND}} dev\` - 运行简单对话示例
- \`{{RUN_COMMAND}} dev:tool\` - 运行工具调用示例
- \`{{RUN_COMMAND}} build\` - 构建 TypeScript 到 JavaScript
- \`{{RUN_COMMAND}} test\` - 运行测试
- \`{{RUN_COMMAND}} eval\` - 运行评估示例

## 文档说明

- **docs/ARCHITECTURE.md**: 核心架构设计文档,详细解释了 LLM、Context、Tool、Agent 四大模块的设计理念和关系。**建议在开发前先阅读此文档,理解上下文工程的设计思想。**

## 设计理念

本项目基于**上下文工程(Context Engineering)**的设计理念:

- **核心**: LLM 模型是应用的关键核心
- **重心**: 开发重心在上下文的获取和编排
- **优势**: 随着模型能力提升,应用效果自动提升;同时充分发挥开发者的创造力

详细的设计理念和模块说明请参考 \`docs/ARCHITECTURE.md\`

## 开源协议

MIT
`;

  await writeFileWithVariables(path.join(targetDir, 'README.md'), readmeTemplate, {
    PROJECT_NAME: config.projectName,
    PACKAGE_MANAGER: config.packageManager,
    RUN_COMMAND: getRunCommand(config.packageManager),
    INSTALL_COMMAND: getInstallCommand(config.packageManager),
  });
}

async function main() {
  try {
    // 1. 收集配置
    const config = await collectProjectInfo();

    // 2. 创建项目目录
    const spinner = p.spinner();
    spinner.start('Creating project directory...');
    await createProjectDirectory(config);
    spinner.stop('Project directory created!');

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
      try {
        await installDependencies(config);
        spinner.stop('Dependencies installed!');
      } catch (error) {
        spinner.stop('Failed to install dependencies');
        p.note(
          `You can install dependencies manually:\n  cd ${config.projectName}\n  ${getInstallCommand(config.packageManager)}`,
          'Note'
        );
      }
    }

    // 6. 完成提示
    const nextSteps = config.shouldInstall
      ? `1. cd ${config.projectName}
2. Copy .env.example to .env and add your API keys
3. ${getRunCommand(config.packageManager)} dev`
      : `1. cd ${config.projectName}
2. ${getInstallCommand(config.packageManager)}
3. Copy .env.example to .env and add your API keys
4. ${getRunCommand(config.packageManager)} dev`;

    p.outro(`✅ Success! Created ${config.projectName}

Next steps:
${nextSteps}

Documentation: https://github.com/yourusername/context-template-cli`);
  } catch (error: any) {
    p.cancel(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
