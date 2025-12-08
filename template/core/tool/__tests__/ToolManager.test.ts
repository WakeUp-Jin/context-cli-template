import { describe, it, expect, beforeEach } from 'vitest';
import { ToolManager } from '../ToolManager.js';

describe('ToolManager 测试', () => {
  let toolManager: ToolManager;

  beforeEach(() => {
    toolManager = new ToolManager();
  });

  describe('基础功能', () => {
    it('应该成功创建 ToolManager 实例', () => {
      expect(toolManager).toBeDefined();
      expect(toolManager).toBeInstanceOf(ToolManager);
    });

    it('应该自动注册所有工具', () => {
      const toolNames = toolManager.getToolNames();
      expect(toolNames).toContain('read_file');
      expect(toolNames).toContain('grep_search');
    });

    it('应该返回正确的工具数量', () => {
      const tools = toolManager.getTools();
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe('工具查询', () => {
    it('应该能够通过名称获取工具', () => {
      const tool = toolManager.getTool('read_file');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('read_file');
      expect(tool?.category).toBe('filesystem');
    });

    it('应该在工具不存在时返回 undefined', () => {
      const tool = toolManager.getTool('non_existent_tool');
      expect(tool).toBeUndefined();
    });

    it('应该正确检查工具是否存在', () => {
      expect(toolManager.hasTool('read_file')).toBe(true);
      expect(toolManager.hasTool('non_existent_tool')).toBe(false);
    });

    it('应该返回所有工具名称', () => {
      const toolNames = toolManager.getToolNames();
      expect(toolNames).toBeInstanceOf(Array);
      expect(toolNames.length).toBeGreaterThan(0);
      expect(toolNames).toContain('read_file');
    });
  });

  describe('工具统计', () => {
    it('应该返回正确的统计信息', () => {
      const stats = toolManager.getStats();
      expect(stats).toHaveProperty('totalTools');
      expect(stats).toHaveProperty('categories');
      expect(stats).toHaveProperty('toolNames');
      expect(stats.totalTools).toBeGreaterThan(0);
    });

    it('应该按分类统计工具数量', () => {
      const stats = toolManager.getStats();
      expect(stats.categories).toHaveProperty('filesystem');
      expect(stats.categories).toHaveProperty('search');
    });
  });

  describe('工具执行', () => {
    it('应该在工具不存在时抛出错误', async () => {
      await expect(
        toolManager.execute('non_existent_tool', {})
      ).rejects.toThrow(/not found/);
    });

    it('应该在错误信息中列出可用工具', async () => {
      try {
        await toolManager.execute('non_existent_tool', {});
      } catch (error: any) {
        expect(error.message).toContain('Available:');
        expect(error.message).toContain('read_file');
      }
    });
  });

  describe('工具结构验证', () => {
    it('每个工具应该有必需的属性', () => {
      const tools = toolManager.getTools();
      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('category');
        expect(tool).toHaveProperty('internal');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('version');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('handler');
        expect(typeof tool.handler).toBe('function');
      });
    });

    it('每个工具的参数定义应该是有效的 JSON Schema', () => {
      const tools = toolManager.getTools();
      tools.forEach((tool) => {
        expect(tool.parameters).toHaveProperty('type');
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters).toHaveProperty('properties');
      });
    });
  });
});

