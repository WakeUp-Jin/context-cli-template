/**
 * 类型定义
 */

export interface ProjectConfig {
  projectName: string;
  packageManager: PackageManager;
  shouldInstall: boolean;

  // 预留扩展字段
  templateType?: 'full' | 'minimal';
  webServer?: 'none' | 'hono' | 'koa' | 'express';
  llmProvider?: 'deepseek' | 'openai' | 'anthropic';
  includeTests?: boolean;
  includeExamples?: boolean;
}

export type PackageManager = 'bun' | 'pnpm' | 'npm';
