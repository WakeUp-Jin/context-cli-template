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

export const ReadFileTool: InternalTool<ReadFileArgs, ReadFileResult> = {
  name: 'read_file',
  category: 'filesystem',
  internal: true,
  description: '读取指定文件的内容。支持文本文件，返回文件内容、大小和行数。',
  version: '1.0.0',
  parameters: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: '要读取的文件路径',
      },
      encoding: {
        type: 'string',
        description: '文件编码，默认为 utf-8',
      },
    },
    required: ['filePath'],
  },

  async handler(args, context) {
    const cwd = context?.cwd || process.cwd();
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
  },

  renderResultForAssistant(result) {
    return [
      `文件: ${result.filePath}`,
      `大小: ${formatSize(result.size)}`,
      `行数: ${result.lineCount}`,
      '',
      '--- 内容 ---',
      result.content,
    ].join('\n');
  },
};

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
