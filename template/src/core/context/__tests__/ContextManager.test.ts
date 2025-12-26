import { describe, it, expect, beforeEach } from 'vitest';
import { ContextManager } from '../ContextManager.js';
import { ContextType } from '../types.js';

describe('ContextManager 测试', () => {
  let contextManager: ContextManager;

  beforeEach(async () => {
    contextManager = new ContextManager();
    await contextManager.init();
  });

  describe('初始化', () => {
    it('应该正确初始化', async () => {
      const manager = new ContextManager();
      expect(manager.isInitialized()).toBe(false);

      await manager.init();
      expect(manager.isInitialized()).toBe(true);
    });

    it('不应该重复初始化', async () => {
      await contextManager.init(); // 第二次调用
      expect(contextManager.isInitialized()).toBe(true);
    });

    it('未初始化时应该抛出错误', () => {
      const manager = new ContextManager();
      expect(() => manager.add('test', ContextType.CONVERSATION)).toThrow(
        'ContextManager 未初始化'
      );
    });
  });

  describe('添加上下文', () => {
    it('应该能添加会话上下文', () => {
      const message = { role: 'user', content: '你好' };
      contextManager.add(message, ContextType.CONVERSATION);

      expect(contextManager.getCount(ContextType.CONVERSATION)).toBe(1);
    });

    it('应该能添加工具上下文', () => {
      const toolCall = {
        id: '1',
        name: 'test_tool',
        arguments: {},
        result: 'success',
      };
      contextManager.add(toolCall, ContextType.TOOL);

      expect(contextManager.getCount(ContextType.TOOL)).toBe(1);
    });

    it('应该能添加记忆上下文', () => {
      const memory = { key: 'user_name', value: '张三' };
      contextManager.add(memory, ContextType.MEMORY);

      expect(contextManager.getCount(ContextType.MEMORY)).toBe(1);
    });
  });

  describe('获取上下文', () => {
    it('应该能获取指定类型的上下文', () => {
      const message = { role: 'user', content: '测试消息' };
      contextManager.add(message, ContextType.CONVERSATION);

      const contexts = contextManager.get(ContextType.CONVERSATION);
      expect(contexts.length).toBe(1);
    });

    it('应该能获取所有上下文', () => {
      contextManager.add(
        { role: 'user', content: '你好' },
        ContextType.CONVERSATION
      );
      contextManager.add(
        { key: 'preference', value: 'dark_mode' },
        ContextType.MEMORY
      );

      const allContexts = contextManager.getAll();
      expect(allContexts.length).toBeGreaterThan(0);
    });

    it('空上下文应该返回空数组', () => {
      const contexts = contextManager.get(ContextType.CONVERSATION);
      expect(contexts).toEqual([]);
    });
  });

  describe('统计信息', () => {
    it('应该正确统计上下文数量', () => {
      contextManager.add(
        { role: 'user', content: '消息1' },
        ContextType.CONVERSATION
      );
      contextManager.add(
        { role: 'user', content: '消息2' },
        ContextType.CONVERSATION
      );
      contextManager.add(
        { key: 'test', value: 'value' },
        ContextType.MEMORY
      );

      const stats = contextManager.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byType[ContextType.CONVERSATION]).toBe(2);
      expect(stats.byType[ContextType.MEMORY]).toBe(1);
    });

    it('应该正确检查上下文是否存在', () => {
      expect(contextManager.hasContext(ContextType.CONVERSATION)).toBe(false);

      contextManager.add(
        { role: 'user', content: '测试' },
        ContextType.CONVERSATION
      );

      expect(contextManager.hasContext(ContextType.CONVERSATION)).toBe(true);
    });

    it('应该正确检查是否为空', () => {
      expect(contextManager.isEmpty()).toBe(true);

      contextManager.add(
        { role: 'user', content: '测试' },
        ContextType.CONVERSATION
      );

      expect(contextManager.isEmpty()).toBe(false);
    });
  });

  describe('更新和删除', () => {
    it('应该能更新指定上下文项', () => {
      contextManager.add(
        { role: 'user', content: '原始消息' },
        ContextType.CONVERSATION
      );

      contextManager.update(ContextType.CONVERSATION, 0, {
        role: 'user',
        content: '更新后的消息',
      });

      const contexts = contextManager.get(ContextType.CONVERSATION);
      expect(contexts[0].content).toContain('更新后的消息');
    });

    it('应该能删除最后一项', () => {
      contextManager.add(
        { role: 'user', content: '消息1' },
        ContextType.CONVERSATION
      );
      contextManager.add(
        { role: 'user', content: '消息2' },
        ContextType.CONVERSATION
      );

      expect(contextManager.getCount(ContextType.CONVERSATION)).toBe(2);

      contextManager.removeLast(ContextType.CONVERSATION);

      expect(contextManager.getCount(ContextType.CONVERSATION)).toBe(1);
    });

    it('应该能清空指定类型的上下文', () => {
      contextManager.add(
        { role: 'user', content: '消息1' },
        ContextType.CONVERSATION
      );
      contextManager.add(
        { role: 'user', content: '消息2' },
        ContextType.CONVERSATION
      );

      contextManager.clear(ContextType.CONVERSATION);

      expect(contextManager.getCount(ContextType.CONVERSATION)).toBe(0);
    });

    it('应该能重置所有上下文', () => {
      contextManager.add(
        { role: 'user', content: '消息' },
        ContextType.CONVERSATION
      );
      contextManager.add(
        { key: 'test', value: 'value' },
        ContextType.MEMORY
      );

      contextManager.reset();

      expect(contextManager.isEmpty()).toBe(true);
    });
  });

  describe('模块访问', () => {
    it('应该能获取指定类型的模块实例', () => {
      const module = contextManager.getModule(ContextType.CONVERSATION);
      expect(module).toBeDefined();
      expect(module.type).toBe(ContextType.CONVERSATION);
    });

    it('应该能获取所有模块', () => {
      const modules = contextManager.getAllModules();
      expect(modules.size).toBe(5); // 5 种上下文类型
    });
  });

  describe('验证', () => {
    it('应该通过验证', () => {
      expect(contextManager.validate()).toBe(true);
    });

    it('未初始化的管理器不应通过验证', () => {
      const manager = new ContextManager();
      expect(manager.validate()).toBe(false);
    });
  });

  describe('预留接口', () => {
    it('压缩检查应该返回 false（未实现）', () => {
      expect(contextManager.needsCompression()).toBe(false);
    });

    it('token 计数应该返回 0（未实现）', async () => {
      const count = await contextManager.getTokenCount();
      expect(count).toBe(0);
    });

    it('应该能导出为 JSON', () => {
      contextManager.add(
        { role: 'user', content: '测试' },
        ContextType.CONVERSATION
      );

      const json = contextManager.toJSON();
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });
  });
});

