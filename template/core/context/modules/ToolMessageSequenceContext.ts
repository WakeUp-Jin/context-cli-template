import { BaseContext } from '../base/BaseContext.js';
import { ContextType, Message } from '../types.js';

/**
 * 工具消息序列上下文管理类
 * 用于存储工具调用循环中的消息序列
 * 顺序: assistant (含tool_calls) → tool → assistant → tool → ...
 */
export class ToolMessageSequenceContext extends BaseContext<Message> {
  constructor() {
    super(ContextType.TOOL_MESSAGE_SEQUENCE);
  }

  /**
   * 格式化为 Message 数组 (API 格式)
   */
  format(): Message[] {
    return this.items.map((item) => item.content);
  }
}
