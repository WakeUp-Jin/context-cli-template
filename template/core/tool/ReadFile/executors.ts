/**
 * 读取文件内容工具
 * 读取指定文件的内容
 */

import * as fs from 'fs';
import * as path from 'path';
import { InternalTool } from '../types.js';

export interface ReadFileArgs {
  /** 文件路径 */
  filePath: string;
  /** 编码，默认 utf-8 */
  encoding?: BufferEncoding;
}

export interface ReadFileResult {
  /** 文件路径 */
  filePath: string;
  /** 文件内容 */
  content: string;
  /** 文件大小（字节） */
  size: number;
  /** 行数 */
  lineCount: number;
}

/**
 * 读取文件执行器
 * @param args - 读取文件参数
 * @param config - 配置
 * @returns - 读取文件结果
 */
export async function readFileExecutor(args: ReadFileArgs, config: any): Promise<ReadFileResult> {
    const cwd = config?.cwd || process.cwd();
    const targetPath = path.resolve(cwd, args.filePath);
    const encoding = args.encoding || 'utf-8';

    // 检查文件是否存在
    if (!fs.existsSync(targetPath)) {
      throw new Error(`文件不存在: ${targetPath}`);
    }

    // 检查是否是文件
    const stats = fs.statSync(targetPath);
    if (!stats.isFile()) {
      throw new Error(`路径不是文件: ${targetPath}`);
    }

    // 检查文件大小，避免读取过大的文件
    const maxSize = 1024 * 1024; // 1MB
    if (stats.size > maxSize) {
      throw new Error(`文件太大 (${formatSize(stats.size)})，最大支持 1MB`);
    }

    // 读取文件内容
    const content = fs.readFileSync(targetPath, encoding);
    const lineCount = content.split('\n').length;

    return {
      filePath: targetPath,
      content,
      size: stats.size,
      lineCount,
    };
  }

/**
 * 格式化工具结果
 * @param result - 读取文件结果
 * @returns - 读取文件结果
 */
export function renderResultForAssistant(result: ReadFileResult): string {
    return [
      `文件: ${result.filePath}`,
      `大小: ${formatSize(result.size)}`,
      `行数: ${result.lineCount}`,
      '',
      '--- 内容 ---',
      result.content,
    ].join('\n');
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
