/**
 * 工具定义类型约束
 * 用于定义所有工具的统一结构,便于格式化并作为提示词传给大模型
 */

/**
 * JSON Schema 参数定义
 */
export interface ToolParameterSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  description?: string;
  properties?: Record<string, ToolParameterSchema>;
  items?: ToolParameterSchema;
  required?: string[];
  enum?: string[];
  default?: any;
}

/**
 * 工具上下文
 */
export interface InternalToolContext {
  abortSignal?: AbortSignal;
  cwd?: string;
  [key: string]: any; // 扩展字段
}

/**
 * 工具定义基础接口
 */
export interface InternalTool<TArgs = any, TResult = any> {
  /** 工具名称(唯一标识) */
  name: string;

  /** 工具分类(如 filesystem、search、network) */
  category: string;

  /** 是否为内部工具 */
  internal: boolean;

  /** 工具描述(简短,详细描述在 prompt 中) */
  description: string;

  /** 版本号 */
  version: string;

  /** 参数定义(JSON Schema 格式) */
  parameters: ToolParameterSchema;

  /** 工具处理函数 */
  handler: (args: TArgs, context?: InternalToolContext) => Promise<TResult>;

  /** 可选:格式化结果给 AI */
  renderResultForAssistant?: (result: TResult) => string;

  /** 可选:权限控制 */
  needsPermissions?: (input?: TArgs) => boolean; // 是否需要权限
  isEnabled?: () => Promise<boolean>; // 是否启用
  isReadOnly?: () => boolean; // 是否只读
  isConcurrencySafe?: () => boolean; // 是否并发安全
}

/**
 * 格式化工具定义为大模型可读格式
 */
export interface FormattedToolDefinition {
  name: string;
  category: string;
  description: string;
  version: string;
  parameters: ToolParameterSchema;
}

/**
 * 将工具定义格式化为大模型输入格式
 */
export function formatToolForLLM(tool: InternalTool): FormattedToolDefinition {
  return {
    name: tool.name,
    category: tool.category,
    description: tool.description,
    version: tool.version,
    parameters: tool.parameters,
  };
}

