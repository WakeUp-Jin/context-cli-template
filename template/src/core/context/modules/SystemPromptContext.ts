import { BaseContext } from '../base/BaseContext.js';
import { ContextType, SystemPromptItem } from '../types.js';

/**
 * 系统提示词上下文管理类
 * 负责管理系统级提示词，支持多段提示词和优先级
 */
export class SystemPromptContext extends BaseContext<SystemPromptItem> {
  constructor() {
    super(ContextType.SYSTEM_PROMPT);
  }

  /**
   * 格式化为单一系统消息
   * 合并所有启用的提示词，按优先级排序
   */
  format(): any[] {
    if (this.items.length === 0) {
      return [];
    }
  
    // item.content 就是字符串
    const combinedContent = this.items.map((item) => item.content).join('\n\n');
  
    return [
      {
        role: 'system',
        content: combinedContent,
      },
    ];
  }

  /**
   * 格式化为普通字符串（用于合并到系统消息中）
   * @returns 合并后的提示词文本，或 null
   */
  formatNormal(): string | null {
    if (this.items.length === 0) {
      return null;
    }
    return this.items.map((item) => item.content).join('\n\n');
  }
}
