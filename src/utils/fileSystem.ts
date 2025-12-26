/**
 * 文件系统工具
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProjectConfig } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 创建项目目录
 */
export async function createProjectDirectory(config: ProjectConfig): Promise<void> {
  const targetDir = path.join(process.cwd(), config.projectName);

  if (await fs.pathExists(targetDir)) {
    throw new Error(`Directory ${config.projectName} already exists`);
  }

  await fs.ensureDir(targetDir);
}

/**
 * 复制模板文件到目标目录
 */
export async function copyTemplateFiles(config: ProjectConfig): Promise<void> {
  const templateDir = path.join(__dirname, '../../template');
  const targetDir = path.join(process.cwd(), config.projectName);

  // 复制 src 目录（包含所有源代码）
  const srcPath = path.join(templateDir, 'src');
  const srcDest = path.join(targetDir, 'src');
  if (await fs.pathExists(srcPath)) {
    await fs.copy(srcPath, srcDest, {
      filter: (src) => {
        const basename = path.basename(src);
        // 过滤掉 .DS_Store 等系统文件
        return !basename.startsWith('.') || basename === '.gitignore';
      },
    });
  }

  // 单独复制 docs 目录（保留在根目录）
  const docsPath = path.join(templateDir, 'docs');
  const docsDest = path.join(targetDir, 'docs');
  if (await fs.pathExists(docsPath)) {
    await fs.copy(docsPath, docsDest, {
      filter: (src) => {
        const basename = path.basename(src);
        return !basename.startsWith('.') || basename === '.gitignore';
      },
    });
  }

  // 复制 .env.example
  const envSrc = path.join(templateDir, '.env.example');
  const envDest = path.join(targetDir, '.env.example');
  if (await fs.pathExists(envSrc)) {
    await fs.copy(envSrc, envDest);
  }
}

/**
 * 替换模板变量
 */
export function replaceVariables(content: string, vars: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * 写入文件并替换变量
 */
export async function writeFileWithVariables(
  filePath: string,
  content: string,
  vars: Record<string, string>
): Promise<void> {
  const replacedContent = replaceVariables(content, vars);
  await fs.writeFile(filePath, replacedContent, 'utf-8');
}
