import { BaseContext } from '../base/BaseContext.js';
import { ContextType } from '../types.js';

/**
 * 相关上下文项
 */
export interface RelevantContextItem {
  /** 上下文键（如 "known_roles", "scene_info"） */
  key: string;
  /** 上下文值（灵活类型） */
  value: any;
  /** 描述 */
  description?: string;
}

/**
 * 相关上下文管理类
 *
 * 用于存储问题相关的背景知识，这些知识：
 * - 不属于用户记忆（非用户个人信息）
 * - 不属于会话历史（非对话记录）
 * - 不属于工具输出（非工具执行结果）
 * - 是为了解决当前问题而需要的临时背景信息
 */
export class RelevantContext extends BaseContext<RelevantContextItem> {
  constructor() {
    super(ContextType.RELEVANT_CONTEXT);
  }

  /**
   * 获取指定键的值
   */
  getValue(key: string): any | undefined {
    const item = this.items.find((item) => item.content.key === key);
    return item?.content.value;
  }

  /**
   * 更新指定键的值
   */
  updateValue(key: string, value: any): void {
    const index = this.items.findIndex((item) => item.content.key === key);
    if (index !== -1) {
      const existingItem = this.items[index].content;
      this.update(index, { ...existingItem, value });
    }
  }

  /**
   * 检查是否存在指定键
   */
  hasKey(key: string): boolean {
    return this.items.some((item) => item.content.key === key);
  }

  /**
   * 格式化为文本数组（用于拼接到 prompt）
   */
  format(): string[] {
    return this.items.map((item) => {
      const { key, value, description } = item.content;
      const desc = description ? ` (${description})` : '';

      // 根据值类型格式化
      if (Array.isArray(value)) {
        return `${key}${desc}: ${value.join('、')}`;
      } else if (typeof value === 'object' && value !== null) {
        return `${key}${desc}: ${JSON.stringify(value)}`;
      } else {
        return `${key}${desc}: ${value}`;
      }
    });
  }
}
