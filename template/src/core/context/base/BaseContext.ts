import { ContextType, ContextItem, IContext } from '../types.js';
import { logger } from '../../../utils/logger.js';

/**
 * 基础上下文抽象类
 * 提供所有上下文模块的通用功能
 */
export abstract class BaseContext<T = any> implements IContext<T> {
  /** 上下文类型 */
  public readonly type: ContextType;

  /** 存储上下文项的数组 */
  protected items: ContextItem<T>[] = [];

  constructor(type: ContextType) {
    this.type = type;
    logger.debug(`初始化上下文模块: ${type}`);
  }

  /**
   * 添加上下文项
   */
  add(content: T, metadata?: Record<string, any>): void {
    const item: ContextItem<T> = {
      content,
      type: this.type,
      metadata,
      timestamp: Date.now(),
      id: this.generateId(),
    };

    this.items.push(item);
    logger.debug(`添加上下文项到 ${this.type}: ${this.items.length} 项`);
  }

  /**
   * 获取所有上下文项
   */
  getAll(): ContextItem<T>[] {
    return [...this.items];
  }

  /**
   * 获取指定索引的上下文项
   */
  get(index: number): ContextItem<T> | undefined {
    if (index < 0 || index >= this.items.length) {
      logger.warn(`索引 ${index} 超出范围 (0-${this.items.length - 1})`);
      return undefined;
    }
    return this.items[index];
  }

  /**
   * 清空所有上下文
   */
  clear(): void {
    const count = this.items.length;
    this.items = [];
    logger.debug(`清空 ${this.type} 上下文: 移除了 ${count} 项`);
  }

  /**
   * 获取上下文数量
   */
  getCount(): number {
    return this.items.length;
  }

  /**
   * 检查是否为空
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * 移除最后一项
   */
  removeLast(): void {
    if (this.items.length > 0) {
      this.items.pop();
      logger.debug(`从 ${this.type} 移除最后一项`);
    } else {
      logger.warn(`尝试从空的 ${this.type} 上下文移除项`);
    }
  }

  /**
   * 更新指定索引的上下文项
   */
  update(index: number, content: T, metadata?: Record<string, any>): void {
    if (index < 0 || index >= this.items.length) {
      logger.error(`无法更新: 索引 ${index} 超出范围`);
      throw new Error(`索引 ${index} 超出范围 (0-${this.items.length - 1})`);
    }

    const oldItem = this.items[index];
    this.items[index] = {
      ...oldItem,
      content,
      metadata: metadata || oldItem.metadata,
      timestamp: Date.now(),
    };

    logger.debug(`更新 ${this.type} 上下文项 [${index}]`);
  }

  /**
   * 格式化为特定格式（由子类实现）
   */
  abstract format(): any[];

  /**
   * TODO: 后续实现序列化
   * 转换为 JSON
   */
  toJSON(): string {
    // TODO: 实现序列化逻辑
    return JSON.stringify({
      type: this.type,
      items: this.items,
    });
  }

  /**
   * TODO: 后续实现序列化
   * 从 JSON 恢复
   */
  fromJSON(json: string): void {
    // TODO: 实现反序列化逻辑
    try {
      const data = JSON.parse(json);
      if (data.type === this.type && Array.isArray(data.items)) {
        this.items = data.items;
        logger.debug(`从 JSON 恢复 ${this.type} 上下文: ${this.items.length} 项`);
      } else {
        throw new Error('无效的 JSON 数据格式');
      }
    } catch (error: any) {
      logger.error(`从 JSON 恢复失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成唯一 ID
   */
  protected generateId(): string {
    return `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

