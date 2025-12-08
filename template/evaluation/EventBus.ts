/**
 * 事件总线 + 数据收集器（合并版本）
 * 负责事件的发射、监听，以及收集执行过程中的数据
 */
import { EventEmitter } from 'events';
import { CollectedData } from './types.js';

/**
 * 事件类型
 */
export type EventType =
  | 'agent:call' // 子Agent被调用
  | 'tool:call' // 工具被调用
  | 'edit:complete'; // 编辑节点完成

/**
 * 事件数据类型
 */
export interface AgentCallEvent {
  agentName: string;
}

export interface ToolCallEvent {
  agentName: string;
  toolName: string;
}

export interface EditCompleteEvent {
  successCount: number;
  failCount: number;
}

/**
 * 事件总线 - 单例模式
 * 合并了事件发射和数据收集功能
 */
class EventBus {
  private emitter = new EventEmitter();
  private static instance: EventBus;

  // 数据收集（原 Collector 功能）
  private agents: string[] = [];
  private tools: Map<string, string[]> = new Map();
  private editResult: { success: number; fail: number } | null = null;

  constructor() {
    this.setupListeners();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): EventBus {
    if (!this.instance) {
      this.instance = new EventBus();
    }
    return this.instance;
  }

  /**
   * 设置内部事件监听器（用于数据收集）
   */
  private setupListeners() {
    // 监听子Agent调用事件
    this.emitter.on('agent:call', (data: AgentCallEvent) => {
      this.agents.push(data.agentName);
      // 为该Agent初始化工具列表
      if (!this.tools.has(data.agentName)) {
        this.tools.set(data.agentName, []);
      }
    });

    // 监听工具调用事件
    this.emitter.on('tool:call', (data: ToolCallEvent) => {
      const agentTools = this.tools.get(data.agentName);
      if (agentTools) {
        // 去重添加
        if (!agentTools.includes(data.toolName)) {
          agentTools.push(data.toolName);
        }
      } else {
        this.tools.set(data.agentName, [data.toolName]);
      }
    });

    // 监听编辑完成事件
    this.emitter.on('edit:complete', (data: EditCompleteEvent) => {
      this.editResult = {
        success: data.successCount,
        fail: data.failCount,
      };
    });
  }

  /**
   * 发射事件
   */
  emit(event: EventType, data: AgentCallEvent | ToolCallEvent | EditCompleteEvent) {
    this.emitter.emit(event, data);
  }

  /**
   * 监听事件（供外部使用）
   */
  on(event: EventType, handler: (data: any) => void) {
    this.emitter.on(event, handler);
  }

  /**
   * 获取收集到的数据
   */
  getData(): CollectedData {
    return {
      agents: [...new Set(this.agents)], // 去重
      tools: Object.fromEntries(this.tools),
      editResult: this.editResult,
    };
  }

  /**
   * 重置收集器（每次测试前调用）
   */
  reset() {
    this.agents = [];
    this.tools = new Map();
    this.editResult = null;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance() {
    if (this.instance) {
      this.instance.emitter.removeAllListeners();
      this.instance = new EventBus();
    }
  }
}

// 导出单例
export const eventBus = EventBus.getInstance();

