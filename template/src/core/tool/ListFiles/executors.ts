/**
 * 列出目录文件工具
 * 列出指定目录下的文件和文件夹
 */

import * as fs from 'fs';
import * as path from 'path';
import { InternalTool } from '../types.js';

export interface ListFilesArgs {
  /** 目录路径，默认为当前工作目录 */
  directory?: string;
}

export interface ListFilesResult {
  /** 目录路径 */
  directory: string;
  /** 文件列表 */
  files: Array<{
    name: string;
    type: 'file' | 'directory';
    size?: number;
  }>;
  /** 文件总数 */
  totalCount: number;
}


/**
 * 列出文件执行器
 * @param args - 列出文件参数
 * @param config - 配置
 * @returns - 列出文件结果
 */
export async function listFilesExecutor(args: ListFilesArgs, config: any): Promise<ListFilesResult> {
    const cwd = config?.cwd || process.cwd();
    const targetDir = args.directory ? path.resolve(cwd, args.directory) : cwd;

    // 检查目录是否存在
    if (!fs.existsSync(targetDir)) {
      throw new Error(`目录不存在: ${targetDir}`);
    }

    // 检查是否是目录
    const stats = fs.statSync(targetDir);
    if (!stats.isDirectory()) {
      throw new Error(`路径不是目录: ${targetDir}`);
    }

    // 读取目录内容
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });

    const files = entries
      .filter((entry) => !entry.name.startsWith('.')) // 过滤隐藏文件
      .map((entry) => {
        const fullPath = path.join(targetDir, entry.name);
        const result: {
          name: string;
          type: 'file' | 'directory';
          size?: number;
        } = {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
        };

        // 对于文件，获取大小
        if (entry.isFile()) {
          try {
            const fileStats = fs.statSync(fullPath);
            result.size = fileStats.size;
          } catch {
            // 忽略权限错误
          }
        }

        return result;
      })
      .sort((a, b) => {
        // 目录在前，文件在后
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    return {
      directory: targetDir,
      files,
      totalCount: files.length,
    };
}

/**
 * 格式化工具结果
 * @param result - 列表文件结果
 * @returns 
 */
export function renderResultForAssistant(result: ListFilesResult): string {
    const lines = [`目录: ${result.directory}`, `共 ${result.totalCount} 个项目:`, ''];

    for (const file of result.files) {
      const icon = file.type === 'directory' ? '📁' : '📄';
      const size = file.size !== undefined ? ` (${formatSize(file.size)})` : '';
      lines.push(`${icon} ${file.name}${size}`);
    }

    return lines.join('\n');
  }



/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
