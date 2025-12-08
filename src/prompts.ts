/**
 * CLI 交互提示逻辑
 */
import * as p from '@clack/prompts';
import { ProjectConfig, PackageManager } from './types.js';

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

  if (p.isCancel(projectName)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  // 2. 包管理器选择
  const packageManager = await p.select({
    message: 'Select a package manager:',
    options: [
      { value: 'bun', label: 'Bun (Fast, modern)' },
      { value: 'pnpm', label: 'pnpm (Efficient)' },
      { value: 'npm', label: 'npm (Standard)' },
    ],
  }) as PackageManager;

  if (p.isCancel(packageManager)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  // 3. 是否安装依赖
  const shouldInstall = await p.confirm({
    message: 'Install dependencies now?',
    initialValue: true,
  });

  if (p.isCancel(shouldInstall)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  return {
    projectName: projectName as string,
    packageManager: packageManager as PackageManager,
    shouldInstall: shouldInstall as boolean,
  };
}
