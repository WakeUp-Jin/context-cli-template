/**
 * 简单 Agent 实现
 * 使用 ContextManager + ToolManager + LLMService 实现基本的工具调用循环
 */

import { ContextManager, ContextType } from '../context/index.js';
import { ToolManager } from '../tool/ToolManager.js';
import { ILLMService, ToolLoopResult } from '../llm/types/index.js';
import { executeToolLoop } from '../llm/utils/executeToolLoop.js';
import { eventBus } from '../../evaluation/EventBus.js';
import { SIMPLE_AGENT_PROMPT } from '../promptManager/index.js';

/**
 * Agent 执行结果
 */
export interface AgentResult {
  /** 收集到的 Agent 名称列表 */
  agents: string[];
  /** 每个 Agent 调用的工具记录 */
  tools: Record<string, string[]>;
  /** 最终响应内容 */
  finalResponse: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * Agent 配置
 */
export interface AgentConfig {
  /** Agent 名称 */
  name?: string;
  /** 最大工具调用循环次数 */
  maxLoops?: number;
  /** 系统提示词 */
  systemPrompt?: string;
}

/**
 * 简单 Agent 类
 *
 * 使用方式：
 * ```typescript
 * const agent = new SimpleAgent(llmService, { name: 'my_agent' });
 * const result = await agent.run('列出当前目录的文件');
 * ```
 */
export class SimpleAgent {
  private llmService: ILLMService;
  private contextManager: ContextManager;
  private toolManager: ToolManager;
  private config: Required<AgentConfig>;

  constructor(llmService: ILLMService, config?: AgentConfig) {
    this.llmService = llmService;
    this.contextManager = new ContextManager();
    this.toolManager = new ToolManager();
    this.config = {
      name: config?.name ?? 'simple_agent',
      maxLoops: config?.maxLoops ?? 10,
      systemPrompt: config?.systemPrompt ?? SIMPLE_AGENT_PROMPT,
    };
  }

  /**
   * 执行 Agent
   * @param userInput - 用户输入
   * @returns Agent 执行结果
   */
  async run(userInput: string): Promise<AgentResult> {
    // 重置事件收集器
    eventBus.reset();

    // 发射 Agent 调用事件
    eventBus.emit('agent:call', { agentName: this.config.name });

    try {
      // 初始化上下文管理器
      await this.contextManager.init();

      // 设置系统提示词
      this.contextManager.add(
        this.config.systemPrompt,
        ContextType.SYSTEM_PROMPT
      );

      // 设置用户输入
      this.contextManager.setUserInput(userInput);

      // 执行工具循环
      const loopResult = await executeToolLoop(
        this.llmService,
        this.contextManager,
        this.toolManager,
        {
          maxLoops: this.config.maxLoops,
          agentName: this.config.name,
        }
      );

      // 从事件系统获取收集的数据
      const collected = eventBus.getData();

      return {
        agents: collected.agents,
        tools: collected.tools,
        finalResponse: loopResult.result || '',
        success: loopResult.success,
        error: loopResult.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Agent 执行失败: ${errorMessage}`);

      // 从事件系统获取收集的数据
      const collected = eventBus.getData();

      return {
        agents: collected.agents,
        tools: collected.tools,
        finalResponse: '',
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 获取 Agent 名称
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * 获取工具管理器
   */
  getToolManager(): ToolManager {
    return this.toolManager;
  }

  /**
   * 获取上下文管理器
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }
}
