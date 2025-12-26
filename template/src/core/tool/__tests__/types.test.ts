import { describe, it, expect } from 'vitest';
import { formatToolForLLM, InternalTool } from '../types.js';

describe('types 测试', () => {
  describe('formatToolForLLM', () => {
    it('应该正确格式化工具定义', () => {
      const mockTool: InternalTool = {
        name: 'test_tool',
        category: 'test',
        internal: true,
        description: 'Test tool description',
        version: '1.0.0',
        parameters: {
          type: 'object',
          properties: {
            arg1: {
              type: 'string',
              description: 'Test argument',
            },
          },
          required: ['arg1'],
        },
        handler: async () => ({ success: true }),
      };

      const formatted = formatToolForLLM(mockTool);

      expect(formatted).toEqual({
        name: 'test_tool',
        category: 'test',
        description: 'Test tool description',
        version: '1.0.0',
        parameters: mockTool.parameters,
      });
    });

    it('应该不包含 handler 和其他内部属性', () => {
      const mockTool: InternalTool = {
        name: 'test_tool',
        category: 'test',
        internal: true,
        description: 'Test tool',
        version: '1.0.0',
        parameters: {
          type: 'object',
          properties: {},
        },
        handler: async () => ({ success: true }),
        renderResultForAssistant: (result) => JSON.stringify(result),
        needsPermissions: () => false,
      };

      const formatted = formatToolForLLM(mockTool);

      expect(formatted).not.toHaveProperty('handler');
      expect(formatted).not.toHaveProperty('internal');
      expect(formatted).not.toHaveProperty('renderResultForAssistant');
      expect(formatted).not.toHaveProperty('needsPermissions');
    });

    it('应该保留完整的参数 Schema 结构', () => {
      const complexParameters = {
        type: 'object' as const,
        properties: {
          nested: {
            type: 'object' as const,
            properties: {
              deep: {
                type: 'string' as const,
              },
            },
          },
          array: {
            type: 'array' as const,
            items: {
              type: 'number' as const,
            },
          },
        },
        required: ['nested'],
      };

      const mockTool: InternalTool = {
        name: 'complex_tool',
        category: 'test',
        internal: true,
        description: 'Complex tool',
        version: '1.0.0',
        parameters: complexParameters,
        handler: async () => ({}),
      };

      const formatted = formatToolForLLM(mockTool);
      expect(formatted.parameters).toEqual(complexParameters);
    });
  });
});

