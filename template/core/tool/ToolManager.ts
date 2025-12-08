import { InternalTool, InternalToolContext } from './types.js';
import { ListFilesTool } from './ListFiles/definitions.js';
import { ReadFileTool } from './ReadFile/definitions.js';

// 注册的工具列表
const toolsList: InternalTool[] = [ListFilesTool, ReadFileTool];

/**
 * OpenAI 格式的工具定义
 */
interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

/**
 * 工具管理类
 * 负责工具的注册、查询和执行
 */
export class ToolManager {
  private tools: Map<string, InternalTool> = new Map();

  constructor() {
    this.registerAllTools();
  }

  /**
   * 注册所有工具
   */
  private registerAllTools() {
    toolsList.forEach((tool) => {
      this.tools.set(tool.name, tool);
    });
  }

  /**
   * 执行指定工具
   */
  async execute<TArgs = any, TResult = any>(
    name: string,
    args: TArgs,
    context?: InternalToolContext
  ): Promise<TResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool '${name}' not found. Available: ${this.getToolNames().join(', ')}`);
    }

    try {
      return await tool.handler(args, context);
    } catch (error: any) {
      console.error(`Tool '${name}' failed:`, error);
      throw error;
    }
  }

  /**
   * 获取格式化的工具定义（OpenAI 格式）
   * 供 LLM API 调用使用
   */
  getFormattedTools(): OpenAITool[] {
    return Array.from(this.tools.values()).map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * 获取所有工具
   */
  getTools(): InternalTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取指定工具
   */
  getTool(name: string): InternalTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具名称
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 检查工具是否存在
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 清空所有工具
   * 用于创建无工具的Agent场景
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * 获取工具统计信息
   */
  getStats() {
    const tools = this.getTools();
    const categories = new Map<string, number>();

    tools.forEach((tool) => {
      const count = categories.get(tool.category) || 0;
      categories.set(tool.category, count + 1);
    });

    return {
      totalTools: tools.length,
      categories: Object.fromEntries(categories),
      toolNames: this.getToolNames(),
    };
  }
}
