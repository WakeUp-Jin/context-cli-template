/**
 * 上下文管理系统的核心类型定义
 */

/**
 * 上下文类型枚举
 */
export enum ContextType {
  /** 会话历史上下文 */
  CONVERSATION_HISTORY = 'conversation_history',
  /** 工具消息序列上下文 */
  TOOL_MESSAGE_SEQUENCE = 'tool_message_sequence',
  /** 用户记忆上下文 */
  MEMORY = 'memory',
  /** 系统提示词上下文 */
  SYSTEM_PROMPT = 'system_prompt',
  /** 结构化输出上下文 */
  STRUCTURED_OUTPUT = 'structured_output',
  /** 相关上下文 */
  RELEVANT_CONTEXT = 'relevant_context',
  /** 执行历史上下文 */
  EXECUTION_HISTORY = 'execution_history',
}

/**
 * 单个上下文项的结构
 */
export interface ContextItem<T = any> {
  /** 上下文内容 */
  content: T;
  /** 上下文类型 */
  type: ContextType;
  /** 元数据 */
  metadata?: Record<string, any>;
  /** 时间戳 */
  timestamp: number;
  /** 唯一标识（可选） */
  id?: string;
}

/**
 * 统计信息结构
 */
export interface ContextStats {
  /** 总计数量 */
  total: number;
  /** 按类型分组的数量 */
  byType: Record<string, number>;
  /** 总 token 数（预留） */
  tokenCount?: number;
}

/**
 * 图片数据
 */
export interface ImageData {
  url?: string;
  base64?: string;
  mimeType?: string;
}

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * 标准消息结构（用于 LLM API 调用）
 */
export interface Message {
  role: MessageRole;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

/**
 * 会话消息结构
 */
export interface ConversationMessage {
  role: MessageRole;
  content: string;
  imageData?: ImageData;
  toolCalls?: any[];
}

/**
 * 用户记忆项结构
 */
export interface MemoryItem {
  /** 记忆键 */
  key: string;
  /** 记忆值 */
  value: any;
  /** 描述 */
  description?: string;
  /** 优先级 */
  priority?: number;
}

/**
 * 系统提示词项结构
 */
export interface SystemPromptItem {
  /** 提示词内容 */
  content: string;
  /** 优先级（数字越小优先级越高） */
  priority?: number;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 结构化输出 Schema
 */
export interface StructuredOutputSchema {
  /** Schema 类型（如 json_schema） */
  type: string;
  /** Schema 定义 */
  schema: Record<string, any>;
  /** 输出格式（json、yaml 等） */
  format?: string;
  /** 是否严格模式 */
  strict?: boolean;
}

/**
 * 基础上下文接口
 * 所有具体上下文模块必须实现的方法
 */
export interface IContext<T = any> {
  /** 上下文类型 */
  readonly type: ContextType;

  /**
   * 添加上下文项
   * @param content - 内容
   * @param metadata - 元数据
   */
  add(content: T, metadata?: Record<string, any>): void;

  /**
   * 获取所有上下文项
   */
  getAll(): ContextItem<T>[];

  /**
   * 获取指定索引的上下文项
   * @param index - 索引
   */
  get(index: number): ContextItem<T> | undefined;

  /**
   * 清空所有上下文
   */
  clear(): void;

  /**
   * 获取上下文数量
   */
  getCount(): number;

  /**
   * 检查是否为空
   */
  isEmpty(): boolean;

  /**
   * 格式化为特定格式（由子类实现）
   */
  format(): any[];

  /**
   * 移除最后一项
   */
  removeLast(): void;

  /**
   * 更新指定索引的上下文项
   * @param index - 索引
   * @param content - 新内容
   * @param metadata - 新元数据
   */
  update(index: number, content: T, metadata?: Record<string, any>): void;

  /**
   * 转换为 JSON
   */
  toJSON(): string;

  /**
   * 从 JSON 恢复
   */
  fromJSON(json: string): void;
}
