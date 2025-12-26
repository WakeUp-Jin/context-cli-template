import { BaseContext } from '../base/BaseContext.js';
import { ContextType, MemoryItem } from '../types.js';

/**
 * 用户记忆上下文管理类
 * 负责管理用户偏好、历史信息等长期记忆
 */
export class MemoryContext extends BaseContext<MemoryItem> {
  /** 用于快速查找的键值映射 */
  private keyMap: Map<string, number> = new Map();

  constructor() {
    super(ContextType.MEMORY);
  }

  /**
   * 重写 add 方法以维护 keyMap
   */
  add(content: MemoryItem, metadata?: Record<string, any>): void {
    // 检查是否已存在
    const existingIndex = this.keyMap.get(content.key);
    if (existingIndex !== undefined) {
      // 更新已存在的记忆
      this.update(existingIndex, content);
    } else {
      // 添加新记忆
      super.add(content, metadata);
      this.keyMap.set(content.key, this.items.length - 1);
    }
  }

  /**
   * 获取指定键的记忆值
   */
  getMemory(key: string): any | undefined {
    const index = this.keyMap.get(key);
    if (index !== undefined) {
      return this.items[index]?.content.value;
    }
    return undefined;
  }

  /**
   * 检查是否存在指定键的记忆
   */
  hasMemory(key: string): boolean {
    return this.keyMap.has(key);
  }

  /**
   * 格式化为自然语言描述
   */
  format(): string[] {
    // 按优先级排序（优先级越小越靠前）
    const sortedItems = [...this.items].sort((a, b) => {
      const priorityA = a.content.priority ?? 999;
      const priorityB = b.content.priority ?? 999;
      return priorityA - priorityB;
    });

    return sortedItems.map((item) => {
      const memory = item.content;
      let text = `${memory.key}: ${JSON.stringify(memory.value)}`;
      if (memory.description) {
        text += ` (${memory.description})`;
      }
      return text;
    });
  }

  /**
   * 清空所有记忆
   */
  clear(): void {
    super.clear();
    this.keyMap.clear();
  }
}
