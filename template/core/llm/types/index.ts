/** 图片数据 */
export interface ImageData {
  url?: string;
  base64?: string;
  mimeType?: string;
}

/** 工具参数定义 */
export interface ToolParameters {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
}

/** 工具定义 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameters;
}

/** 工具集合 */
export type ToolSet = Record<string, Tool>;

/** 工具调用 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/** LLM 配置 */
export interface LLMConfig {
  provider: string;
  model: string;
  apiKey?: string;
  maxIterations?: number;
  baseURL?: string;
  qwenOptions?: Record<string, any>;
  aws?: Record<string, any>;
  azure?: Record<string, any>;
}

/** MCP Manager 接口 (占位符) */
export interface MCPManager {
  getAllTools(): Promise<ToolSet>;
  executeTool(name: string, args: any): Promise<any>;
}

/** Context Manager - 导入真实实现 */
export { ContextManager } from '../../context/index.js';

/** Unified Tool Manager 接口 (占位符) */
export interface UnifiedToolManager {
  getToolsForProvider(provider: string): Promise<any[]>;
  getAllTools(): Promise<ToolSet>;
  executeTool(name: string, args: any): Promise<any>;
}

/** Event Manager 接口 (占位符) */
export interface EventManager {
  emit(event: string, data: any): void;
}

/**
 * LLM 响应结构
 */
export interface LLMResponse {
  /** 响应内容 */
  content: string;
  /** 工具调用列表 */
  toolCalls?: ToolCall[];
  /** 结束原因 */
  finishReason?: string;
  /** Token 使用统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM 调用选项
 */
export interface LLMChatOptions {
  /** 温度参数 (0-2) */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 工具选择策略 */
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  /** Top P 采样 */
  topP?: number;
  /** 频率惩罚 */
  frequencyPenalty?: number;
  /** 存在惩罚 */
  presencePenalty?: number;
  /** 停止词 */
  stop?: string | string[];
  /** 结构化输出格式 */
  responseFormat?: any;
}

/**
 * 工具循环执行结果
 */
export interface ToolLoopResult {
  /** 是否成功 */
  success: boolean;
  /** 最终结果 */
  result?: string;
  /** 错误信息 */
  error?: string;
  /** 循环次数 */
  loopCount: number;
}

/**
 * 工具循环配置
 */
export interface ToolLoopConfig {
  /** 最大循环次数 */
  maxLoops?: number;
  /** Agent 名称 */
  agentName?: string;
}

/** LLM Service 核心接口 */
export interface ILLMService {
  /**
   * 核心方法：上下文补全
   * 接收格式化的上下文（消息历史），返回模型响应
   * @param messages - 上下文消息列表
   * @param tools - 可用的工具定义列表
   * @param options - 生成参数（temperature, maxTokens 等）
   * @returns 模型响应（包含内容、工具调用、使用统计）
   */
  complete(
    messages: any[],
    tools?: any[],
    options?: LLMChatOptions
  ): Promise<LLMResponse>;

  /**
   * 简单对话：无工具，单次调用
   * @param userInput - 用户输入
   * @param systemPrompt - 可选的系统提示词
   */
  simpleChat(userInput: string, systemPrompt?: string): Promise<string>;

  /**
   * 完整方法：支持工具调用循环（可选实现）
   * 内置工具调用、上下文管理、迭代执行
   * @param userInput - 用户输入
   * @param imageData - 可选的图片数据
   * @param stream - 是否流式输出
   */
  generate?(
    userInput: string,
    imageData?: ImageData,
    stream?: boolean
  ): Promise<string>;

  /** 获取配置 */
  getConfig(): { provider: string; model: string };

  /** 可选：事件管理器 */
  setEventManager?(eventManager: EventManager): void;

  /** @deprecated 由 Agent 管理工具 */
  getAllTools?(): Promise<ToolSet>;
}
