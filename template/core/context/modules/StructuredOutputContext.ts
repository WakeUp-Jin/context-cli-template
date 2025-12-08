import { BaseContext } from '../base/BaseContext.js';
import { ContextType, StructuredOutputSchema } from '../types.js';

/**
 * 结构化输出上下文管理类
 * 负责管理结构化输出的 Schema 定义
 */
export class StructuredOutputContext extends BaseContext<StructuredOutputSchema> {
  constructor() {
    super(ContextType.STRUCTURED_OUTPUT);
  }

  /**
   * 格式化为 LLM 理解的格式
   * 转换为 OpenAI 的 response_format 格式
   */
  format(): any[] {
    if (this.isEmpty()) {
      return [];
    }
    
    // item.content 就是字符串（如 'json'）
    const latestItem = this.items[this.items.length - 1];
    const type = latestItem.content;

    return [
      {
        type: type,
      },
    ];
  }
}
