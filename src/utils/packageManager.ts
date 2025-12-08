/**
 * 包管理器工具
 */
import { execa } from 'execa';
import path from 'path';
import { ProjectConfig } from '../types.js';

/**
 * 安装依赖
 */
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

/**
 * 获取运行命令前缀
 */
export function getRunCommand(packageManager: string): string {
  switch (packageManager) {
    case 'bun':
      return 'bun run';
    case 'pnpm':
      return 'pnpm';
    case 'npm':
      return 'npm run';
    default:
      return 'npm run';
  }
}

/**
 * 获取安装命令
 */
export function getInstallCommand(packageManager: string): string {
  switch (packageManager) {
    case 'bun':
      return 'bun install';
    case 'pnpm':
      return 'pnpm install';
    case 'npm':
      return 'npm install';
    default:
      return 'npm install';
  }
}
