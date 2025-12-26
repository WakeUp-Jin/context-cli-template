/**
 * package.json 生成器
 */
import { ProjectConfig } from '../types.js';

export function generatePackageJson(config: ProjectConfig): object {
  return {
    name: config.projectName,
    version: '0.1.0',
    type: 'module',
    description: 'LLM application built with context-template-cli',
    main: 'dist/index.js',
    scripts: {
      // 开发脚本
      dev: 'tsx watch src/examples/simple-chat.ts',
      'dev:multi-chat': 'tsx watch src/examples/multi-chat.ts',

      // 构建脚本
      build: 'tsc',
      'type-check': 'tsc --noEmit',

      // 测试脚本
      test: 'vitest run',
      'test:watch': 'vitest',
      'test:ui': 'vitest --ui',

      // 评估脚本
      eval: 'tsx src/evaluation/example.ts',

      // 清理脚本
      clean: 'rm -rf dist',
    },
    dependencies: {
      openai: '^4.70.4', // OpenAI SDK (兼容 DeepSeek)
      dotenv: '^16.4.7', // 环境变量加载
    },
    devDependencies: {
      '@types/node': '^22.10.1', // Node 类型定义
      tsx: '^4.19.2', // TypeScript 执行器
      typescript: '^5.7.2', // TypeScript 编译器
      vitest: '^2.1.8', // 测试框架
      '@vitest/ui': '^2.1.8', // 测试 UI
    },
    engines: {
      node: '>=18.0.0',
    },
    keywords: ['llm', 'ai', 'deepseek', 'context', 'tool-calling', 'agent'],
  };
}
