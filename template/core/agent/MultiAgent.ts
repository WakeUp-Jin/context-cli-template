/**
 * 多智能体系统实现
 * 演示主Agent协调多个子Agent完成任务的架构
 */

import { ContextManager, ContextType, Message } from '../context/index.js';
import { ToolManager } from '../tool/ToolManager.js';
import { ILLMService } from '../llm/types/index.js';
import { executeToolLoop } from '../llm/utils/executeToolLoop.js';
import { ExecutionHistoryContext } from '../context/modules/ExecutionHistoryContext.js';
import { eventBus } from '../../evaluation/EventBus.js';
import {
  MAIN_AGENT_PROMPT,
  SUB_AGENT_A_PROMPT,
  SUB_AGENT_B_PROMPT,
} from '../promptManager/index.js';

/**
 * 子Agent执行结果
 */
export interface SubAgentResult {
  /** 子Agent名称 */
  agentName: string;
  /** 执行结果 */
  result: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 主Agent执行结果
 */
export interface MainAgentResult {
  /** 收集到的 Agent 名称列表 */
  agents: string[];
  /** 每个 Agent 调用的工具记录 */
  tools: Record<string, string[]>;
  /** 最终响应 */
  finalResponse: string;
  /** 子Agent执行记录 */
  subAgentResults: SubAgentResult[];
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 子Agent类
 * 使用 executeToolLoop 执行任务（工具可为空）
 */
export class SubAgent {
  private name: string;
  private llmService: ILLMService;
  private systemPrompt: string;
  private maxLoops: number;

  constructor(
    name: string,
    llmService: ILLMService,
    systemPrompt: string,
    maxLoops: number = 5
  ) {
    this.name = name;
    this.llmService = llmService;
    this.systemPrompt = systemPrompt;
    this.maxLoops = maxLoops;
  }

  /**
   * 执行子Agent任务
   * @param instruction - 主Agent下发的指令
   */
  async run(instruction: string): Promise<SubAgentResult> {
    console.log(`\n🤖 子Agent [${this.name}] 开始执行...`);
    console.log(`📋 指令: ${instruction}`);

    // 发射子Agent调用事件
    eventBus.emit('agent:call', { agentName: this.name });

    try {
      // 初始化上下文管理器
      const contextManager = new ContextManager();
      await contextManager.init();

      // 设置系统提示词
      contextManager.add(
        this.systemPrompt,
        ContextType.SYSTEM_PROMPT
      );

      // 设置用户输入（来自主Agent的指令）
      contextManager.setUserInput(instruction);

      // 初始化工具管理器（工具为空，但仍使用 executeToolLoop）
      const toolManager = new ToolManager();
      // 清空默认工具，使子Agent无工具可用
      toolManager.clear();

      // 执行工具循环
      const loopResult = await executeToolLoop(
        this.llmService,
        contextManager,
        toolManager,
        {
          maxLoops: this.maxLoops,
          agentName: this.name,
        }
      );

      console.log(`✅ 子Agent [${this.name}] 执行完成`);

      return {
        agentName: this.name,
        result: loopResult.result || '',
        success: loopResult.success,
        error: loopResult.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ 子Agent [${this.name}] 执行失败: ${errorMessage}`);

      return {
        agentName: this.name,
        result: '',
        success: false,
        error: errorMessage,
      };
    }
  }

  getName(): string {
    return this.name;
  }
}

/**
 * 主Agent类
 * 协调者角色，负责任务分配和结果汇总
 * 不直接使用工具，而是通过调用子Agent完成任务
 */
export class MainAgent {
  private name: string;
  private llmService: ILLMService;
  private systemPrompt: string;
  private subAgentA: SubAgent;
  private subAgentB: SubAgent;
  private contextManager: ContextManager;

  constructor(llmService: ILLMService, name: string = 'main_agent') {
    this.name = name;
    this.llmService = llmService;
    this.systemPrompt = MAIN_AGENT_PROMPT;
    this.contextManager = new ContextManager();

    // 初始化两个子Agent
    this.subAgentA = new SubAgent(
      'researcher',
      llmService,
      SUB_AGENT_A_PROMPT
    );
    this.subAgentB = new SubAgent(
      'executor',
      llmService,
      SUB_AGENT_B_PROMPT
    );
  }

  /**
   * 执行主Agent
   * @param userInput - 用户输入
   */
  async run(userInput: string): Promise<MainAgentResult> {
    
    // 初始化上下文管理器
    this.contextManager.init();

    // 重置事件收集器
    eventBus.reset();

    // 发射主Agent调用事件
    eventBus.emit('agent:call', { agentName: this.name });

    console.log(`\n🎯 主Agent [${this.name}] 开始处理任务...`);
    console.log(`📝 用户输入: ${userInput}`);

    const subAgentResults: SubAgentResult[] = [];

    try {
      // 1. 调用子Agent A（研究者）
      const instructionA = `请针对以下用户需求进行研究分析：\n${userInput}`;
      const resultA = await this.subAgentA.run(instructionA);
      subAgentResults.push(resultA);

      let executionHistoryA = `
      子Agent执行完成-${this.subAgentA.getName()}:
      主Agent指令: ${instructionA}
      输出: ${resultA.result}
      `;
      this.contextManager.add(executionHistoryA, ContextType.EXECUTION_HISTORY);

      // 2. 调用子Agent B（执行者）
      const instructionB = `基于以下用户需求，请提供具体的执行方案：\n${userInput}`;
      const resultB = await this.subAgentB.run(instructionB);
      subAgentResults.push(resultB);

      // 记录子Agent B的执行结果
      let executionHistoryB = `
      子Agent执行完成-${this.subAgentB.getName()}:
      主Agent指令: ${instructionB}
      输出: ${resultB.result}
      `;
      this.contextManager.add(executionHistoryB, ContextType.EXECUTION_HISTORY);

      // 3. 主Agent汇总结果
      const finalResponse = await this.summarizeResults(userInput);

      console.log(`\n✅ 主Agent [${this.name}] 任务完成`);

      // 从事件系统获取收集的数据
      const collected = eventBus.getData();

      return {
        agents: collected.agents,
        tools: collected.tools,
        finalResponse,
        subAgentResults,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ 主Agent [${this.name}] 执行失败: ${errorMessage}`);

      // 从事件系统获取收集的数据
      const collected = eventBus.getData();

      return {
        agents: collected.agents,
        tools: collected.tools,
        finalResponse: '',
        subAgentResults,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 汇总子Agent结果
   * 主Agent不使用工具，直接调用LLM进行汇总
   */
  private async summarizeResults(userInput: string): Promise<string> {
    console.log(`\n📊 主Agent 正在汇总子Agent结果...`);

    // 构建汇总上下文
    const contextManager = new ContextManager();
    await contextManager.init();

    // 设置系统提示词
    contextManager.add(
      this.systemPrompt,
      ContextType.SYSTEM_PROMPT
    );


    // 设置汇总指令
    const summarizeInstruction = `基于上述子Agent的研究分析和执行方案，请为用户提供一个综合性的最终答复。

用户原始需求：${userInput}

请整合各子Agent的输出，给出完整、清晰的最终响应。`;

    contextManager.setUserInput(summarizeInstruction);

    // 获取上下文并调用LLM（不使用工具）
    const messages = contextManager.getContext();
    const response = await this.llmService.complete(messages, []);

    return response.content || '';
  }

  /**
   * 获取执行历史
   */
  getExecutionHistory(): Message[] {
    return this.contextManager.get(ContextType.EXECUTION_HISTORY);
  }

  getName(): string {
    return this.name;
  }
}

/**
 * 创建多智能体系统的便捷函数
 */
export function createMultiAgentSystem(llmService: ILLMService): MainAgent {
  return new MainAgent(llmService);
}
