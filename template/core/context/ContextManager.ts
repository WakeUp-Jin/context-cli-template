import { ContextType, ContextStats, IContext, Message } from "./types.js";
import { ConversationContext } from "./modules/ConversationContext.js";
import { ToolMessageSequenceContext } from "./modules/ToolMessageSequenceContext.js";
import { MemoryContext } from "./modules/MemoryContext.js";
import { SystemPromptContext } from "./modules/SystemPromptContext.js";
import { StructuredOutputContext } from "./modules/StructuredOutputContext.js";
import { RelevantContext } from "./modules/RelevantContext.js";
import { ExecutionHistoryContext } from "./modules/ExecutionHistoryContext.js";

/**
 * 上下文管理器
 * 负责统一管理所有类型的上下文模块
 */
export class ContextManager {
  /** 存储所有上下文模块的映射 */
  private contexts: Map<ContextType, IContext> = new Map();
  /** 用户输入 */
  private userInput: string = "";
  /** 是否已初始化 */
  private initialized: boolean = false;

  constructor() {}

  /**
   * 初始化所有上下文模块
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 初始化所有上下文模块
    this.contexts.set(
      ContextType.CONVERSATION_HISTORY,
      new ConversationContext()
    );
    this.contexts.set(
      ContextType.TOOL_MESSAGE_SEQUENCE,
      new ToolMessageSequenceContext()
    );
    this.contexts.set(ContextType.MEMORY, new MemoryContext());
    this.contexts.set(ContextType.SYSTEM_PROMPT, new SystemPromptContext());
    this.contexts.set(
      ContextType.STRUCTURED_OUTPUT,
      new StructuredOutputContext()
    );
    this.contexts.set(ContextType.RELEVANT_CONTEXT, new RelevantContext());

    this.contexts.set(ContextType.EXECUTION_HISTORY, new ExecutionHistoryContext());

    this.initialized = true;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /** 设置用户输入 */
  setUserInput(userInput: string): void {
    this.userInput = userInput;
  }

  /**
   * 统一的添加上下文方法
   * @param content - 上下文内容
   * @param type - 上下文类型
   * @param metadata - 可选的元数据
   *
   * @example
   * // SYSTEM_PROMPT - 字符串
   * contextManager.add('你是一个助手', ContextType.SYSTEM_PROMPT);
   *
   * // MEMORY - { key, value } 格式
   * contextManager.add({ key: 'user_name', value: '张三' }, ContextType.MEMORY);
   *
   * // CONVERSATION_HISTORY - { role, content } 格式
   * contextManager.add({ role: 'user', content: '你好' }, ContextType.CONVERSATION_HISTORY);
   *
   * // TOOL_MESSAGE_SEQUENCE - Message 对象
   * contextManager.add({ role: 'assistant', content: '...', tool_calls: [...] }, ContextType.TOOL_MESSAGE_SEQUENCE);
   *
   * // STRUCTURED_OUTPUT - 字符串
   * contextManager.add('json', ContextType.STRUCTURED_OUTPUT);
   *
   * // RELEVANT_CONTEXT - { key, value } 格式
   * contextManager.add({ key: 'scene', value: '客服场景' }, ContextType.RELEVANT_CONTEXT);
   */
  add(content: any, type: ContextType, metadata?: Record<string, any>): void {
    this.ensureInitialized();

    const context = this.contexts.get(type);
    if (!context) {
      throw new Error(`未知的上下文类型: ${type}`);
    }

    this.validateContent(content, type);
    context.add(content, metadata);
  }

  /**
   * 校验 content 格式是否匹配 type
   */
  private validateContent(content: any, type: ContextType): void {
    switch (type) {
      case ContextType.SYSTEM_PROMPT:
      case ContextType.STRUCTURED_OUTPUT:
      case ContextType.EXECUTION_HISTORY:
        if (typeof content !== "string") {
          throw new Error(`${type} 需要字符串类型`);
        }
        break;
      case ContextType.TOOL_MESSAGE_SEQUENCE:
      case ContextType.CONVERSATION_HISTORY:
        if (!content?.role || content?.content === undefined) {
          throw new Error(`${type} 需要 { role, content } 格式的 Message 对象`);
        }
        break;
      case ContextType.MEMORY:
      case ContextType.RELEVANT_CONTEXT:
        if (!content?.key || content?.value === undefined) {
          throw new Error(`${type} 需要 { key, value } 格式`);
        }
        break;
    }
  }

  /**
   * 获取指定类型的上下文
   * @param type - 上下文类型
   * @returns 格式化的上下文数据
   */
  get(type: ContextType): any[] {
    this.ensureInitialized();

    const context = this.contexts.get(type);
    if (!context) {
      throw new Error(`未知的上下文类型: ${type}`);
    }

    return context.format();
  }

  /**
   * 获取完整上下文（供 LLM 调用使用）
   *
   * 自动检测并组装所有可用的上下文类型：
   * - system消息（systemPrompt + structuredOutput + relevantContext + memory + 会话历史摘要）
   * - 用户输入
   * - 工具消息序列
   *
   * @returns Message[] 格式的上下文数组
   */
  getContext(): Message[] {
    this.ensureInitialized();

    const messages: Message[] = [];

    // 1. system消息（包含历史摘要）
    const systemMessage = this.buildSystemMessage();
    if (systemMessage) {
      messages.push(systemMessage);
    }

    // 2. 用户输入（当前请求）
    if (this.userInput) {
      messages.push({ role: "user", content: this.userInput });
    }

    // 3. 工具消息序列
    const toolContext = this.contexts.get(ContextType.TOOL_MESSAGE_SEQUENCE);
    if (toolContext && !toolContext.isEmpty()) {
      const toolMessages = toolContext.format();
      if (toolMessages && toolMessages.length > 0) {
        messages.push(...toolMessages);
      }
    }

    // 4. 执行历史
    const executionHistory = this.getModule<ExecutionHistoryContext>(
      ContextType.EXECUTION_HISTORY
    );
    const executionHistoryMessages = executionHistory.format();
    if (executionHistoryMessages.length > 0) {
      messages.push(...executionHistoryMessages);
    }

    return messages;
  }

  /**
   * 构建system消息（私有方法）
   * 自动拼接: systemPrompt + structuredOutput + relevantContext + memory + 会话历史摘要
   *
   * @returns Message 对象或 null
   */
  private buildSystemMessage(): Message | null {
    const parts: string[] = [];

    // 1. 系统提示词（必需）
    const systemPromptContext = this.getModule<SystemPromptContext>(
      ContextType.SYSTEM_PROMPT
    );
    const systemPrompts = systemPromptContext.formatNormal();
    if (systemPrompts) {
      parts.push(systemPrompts);
    }

    // 2. 结构化输出要求
    const structuredOutputContext = this.getModule<StructuredOutputContext>(
      ContextType.STRUCTURED_OUTPUT
    );
    const structuredOutput = structuredOutputContext.format();
    if (structuredOutput.length > 0) {
      parts.push("\n【结构化输出要求】");
      parts.push(structuredOutput[0]);
    }

    // 3. 相关上下文
    const relevantContext = this.getModule<RelevantContext>(
      ContextType.RELEVANT_CONTEXT
    );
    const relevantInfo = relevantContext.format();
    if (relevantInfo.length > 0) {
      parts.push("\n【相关上下文】");
      parts.push(relevantInfo.join("\n"));
    }

    // 4. 用户记忆
    const memoryContext = this.getModule<MemoryContext>(ContextType.MEMORY);
    const memories = memoryContext.format();
    if (memories.length > 0) {
      parts.push("\n【用户记忆】");
      parts.push(memories.join("\n"));
    }

    // 5. 会话历史摘要
    const historySummary = this.formatConversationHistoryForPrompt();
    if (historySummary) {
      parts.push(historySummary);
    }

    // 如果没有任何内容,返回null
    if (parts.length === 0) {
      return null;
    }

    return {
      role: "system",
      content: parts.join("\n"),
    };
  }

  /**
   * 将会话历史格式化为简洁列表（用于系统提示词）
   * 只取最近15条，以简洁形式呈现
   *
   * @returns 格式化的历史摘要字符串，或 null
   */
  private formatConversationHistoryForPrompt(): string | null {
    const conversationContext = this.contexts.get(
      ContextType.CONVERSATION_HISTORY
    );
    if (!conversationContext || conversationContext.isEmpty()) {
      return null;
    }

    const history = conversationContext.format();
    if (!history || history.length === 0) {
      return null;
    }

    // 取最近15条
    const recentHistory = history.slice(-15);

    const lines: string[] = [];
    lines.push("\n## 【历史对话参考】");
    lines.push("");
    lines.push("最近对话记录：");

    recentHistory.forEach((msg, idx) => {
      const role = msg.role === "user" ? "[用户]" : "[助手]";
      let summary = "";
      try {
        const content = JSON.parse(msg.content as string);
        if (msg.role === "user") {
          summary = content.text || msg.content;
        } else {
          summary =
            content.action === "finish"
              ? `已完成: ${(content.result || "").slice(0, 50)}...`
              : content.action || (msg.content as string).slice(0, 50);
        }
      } catch {
        summary =
          typeof msg.content === "string"
            ? msg.content.slice(0, 50)
            : String(msg.content);
      }
      lines.push(`${idx + 1}. ${role} ${summary}`);
    });

    return lines.join("\n");
  }

  /**
   * 添加相关上下文
   */
  addRelevantContext(key: string, value: any, description?: string): void {
    this.ensureInitialized();
    this.add({ key, value, description }, ContextType.RELEVANT_CONTEXT);
  }

  /**
   * 获取相关上下文值
   */
  getRelevantContextValue(key: string): any {
    this.ensureInitialized();
    const relevantContext = this.getModule<RelevantContext>(
      ContextType.RELEVANT_CONTEXT
    );
    return relevantContext.getValue(key);
  }

  /**
   * 更新相关上下文
   */
  updateRelevantContext(key: string, value: any): void {
    this.ensureInitialized();
    const relevantContext = this.getModule<RelevantContext>(
      ContextType.RELEVANT_CONTEXT
    );
    relevantContext.updateValue(key, value);
  }

  /**
   * 获取指定类型上下文的数量
   */
  getCount(type: ContextType): number {
    this.ensureInitialized();

    const context = this.contexts.get(type);
    if (!context) {
      throw new Error(`未知的上下文类型: ${type}`);
    }

    return context.getCount();
  }

  /**
   * 获取所有上下文的统计信息
   */
  getStats(): ContextStats {
    this.ensureInitialized();

    let total = 0;
    const byType: Record<string, number> = {};

    this.contexts.forEach((context, type) => {
      const count = context.getCount();
      total += count;
      byType[type] = count;
    });

    return {
      total,
      byType,
      tokenCount: undefined,
    };
  }

  /**
   * 检查指定类型上下文是否存在
   */
  hasContext(type: ContextType): boolean {
    this.ensureInitialized();
    const context = this.contexts.get(type);
    return context ? !context.isEmpty() : false;
  }

  /**
   * 检查上下文是否为空
   */
  isEmpty(): boolean {
    this.ensureInitialized();
    return Array.from(this.contexts.values()).every((context) =>
      context.isEmpty()
    );
  }

  /**
   * 清空指定类型的上下文
   */
  clear(type: ContextType): void {
    this.ensureInitialized();

    const context = this.contexts.get(type);
    if (!context) {
      throw new Error(`未知的上下文类型: ${type}`);
    }

    context.clear();
  }

  /**
   * 重置所有上下文（清空状态）
   */
  reset(): void {
    this.ensureInitialized();

    this.contexts.forEach((context) => {
      context.clear();
    });
    this.userInput = "";
  }

  /**
   * 获取指定类型的上下文模块实例
   */
  getModule<T extends IContext>(type: ContextType): T {
    this.ensureInitialized();

    const context = this.contexts.get(type);
    if (!context) {
      throw new Error(`未知的上下文类型: ${type}`);
    }

    return context as T;
  }

  /**
   * 打印当前上下文状态（调试用）
   */
  debug(): void {
    this.ensureInitialized();

    console.log("=== ContextManager 状态 ===");
    console.log(`已初始化: ${this.initialized}`);
    console.log(`总计: ${this.getStats().total} 项`);
    console.log("\n各类型统计:");

    this.contexts.forEach((context, type) => {
      console.log(`  ${type}: ${context.getCount()} 项`);
    });

    console.log("========================\n");
  }

  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("ContextManager 未初始化，请先调用 init() 方法");
    }
  }
}
