import { BaseContext } from '../base/BaseContext.js';
import { ContextType, Message } from '../types.js';

/**
 * 执行历史上下文管理类
 * 专门用于主Agent记录子Agent的执行结果
 * 存储字符串，格式化时转换为 user 消息
 */
export class ExecutionHistoryContext extends BaseContext<string> {
  constructor() {
    super(ContextType.EXECUTION_HISTORY);
  }


  /**
   * 格式化为 Message 数组
   * 将存储的字符串转换为 user 角色的消息
   */
  format(): Message[] {
    return this.items.map(item => ({
      role: 'user' as const,
      content: item.content,
    }));
  }

  /**
   * 获取最后一次执行记录（字符串形式）
   */
  getLastExecutionRecord(): string | undefined {
    if (this.items.length === 0) return undefined;
    return this.items[this.items.length - 1].content;
  }

}
