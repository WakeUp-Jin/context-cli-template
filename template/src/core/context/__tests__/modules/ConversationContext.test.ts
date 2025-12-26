import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationContext } from '../../modules/ConversationContext.js';
import { ContextType } from '../../types.js';

describe('ConversationContext 测试', () => {
  let context: ConversationContext;

  beforeEach(() => {
    context = new ConversationContext();
  });

  it('应该正确初始化', () => {
    expect(context.type).toBe(ContextType.CONVERSATION);
    expect(context.isEmpty()).toBe(true);
    expect(context.getCount()).toBe(0);
  });

  describe('添加消息', () => {
    it('应该能添加用户消息', () => {
      context.addUserMessage('你好');

      expect(context.getCount()).toBe(1);
      const messages = context.format();
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('你好');
    });

    it('应该能添加助手消息', () => {
      context.addAssistantMessage('你好！有什么可以帮助你的吗？');

      expect(context.getCount()).toBe(1);
      const messages = context.format();
      expect(messages[0].role).toBe('assistant');
    });

    it('应该能添加系统消息', () => {
      context.addSystemMessage('你是一个有帮助的助手');

      expect(context.getCount()).toBe(1);
      const messages = context.format();
      expect(messages[0].role).toBe('system');
    });

    it('应该能添加带图片的消息', () => {
      context.addUserMessage('这是什么？', {
        url: 'https://example.com/image.jpg',
      });

      const messages = context.format();
      expect(messages[0].content).toBeDefined();
      expect(Array.isArray(messages[0].content)).toBe(true);
    });

    it('应该能添加带工具调用的助手消息', () => {
      const toolCalls = [
        {
          id: 'call_1',
          type: 'function',
          function: { name: 'get_weather', arguments: '{"city": "北京"}' },
        },
      ];

      context.addAssistantMessage('让我查一下天气', toolCalls);

      const messages = context.format();
      expect(messages[0].tool_calls).toBeDefined();
      expect(messages[0].tool_calls?.length).toBe(1);
    });
  });

  describe('格式化', () => {
    it('应该正确格式化为 LLM 消息格式', () => {
      context.addUserMessage('你好');
      context.addAssistantMessage('你好！');

      const formatted = context.format();

      expect(formatted).toHaveLength(2);
      expect(formatted[0].role).toBe('user');
      expect(formatted[1].role).toBe('assistant');
    });

    it('应该正确格式化带 base64 图片的消息', () => {
      context.addUserMessage('分析这张图片', {
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
      });

      const formatted = context.format();
      expect(Array.isArray(formatted[0].content)).toBe(true);
    });
  });

  describe('查询方法', () => {
    it('应该能获取最后一条消息', () => {
      context.addUserMessage('第一条消息');
      context.addUserMessage('第二条消息');

      const lastMessage = context.getLastMessage();
      expect(lastMessage?.content).toBe('第二条消息');
    });

    it('应该能按角色统计消息数量', () => {
      context.addUserMessage('用户消息1');
      context.addUserMessage('用户消息2');
      context.addAssistantMessage('助手消息');

      expect(context.getCountByRole('user')).toBe(2);
      expect(context.getCountByRole('assistant')).toBe(1);
    });

    it('应该能获取所有用户消息', () => {
      context.addUserMessage('用户消息1');
      context.addAssistantMessage('助手消息');
      context.addUserMessage('用户消息2');

      const userMessages = context.getUserMessages();
      expect(userMessages.length).toBe(2);
      expect(userMessages[0].content).toBe('用户消息1');
      expect(userMessages[1].content).toBe('用户消息2');
    });

    it('应该能获取所有助手消息', () => {
      context.addUserMessage('用户消息');
      context.addAssistantMessage('助手消息1');
      context.addAssistantMessage('助手消息2');

      const assistantMessages = context.getAssistantMessages();
      expect(assistantMessages.length).toBe(2);
    });
  });

  describe('基础操作', () => {
    it('应该能清空所有消息', () => {
      context.addUserMessage('测试消息');
      expect(context.getCount()).toBe(1);

      context.clear();
      expect(context.getCount()).toBe(0);
      expect(context.isEmpty()).toBe(true);
    });

    it('应该能删除最后一条消息', () => {
      context.addUserMessage('消息1');
      context.addUserMessage('消息2');
      expect(context.getCount()).toBe(2);

      context.removeLast();
      expect(context.getCount()).toBe(1);
    });

    it('应该能更新指定消息', () => {
      context.addUserMessage('原始消息');

      context.update(0, {
        role: 'user',
        content: '更新后的消息',
      });

      const messages = context.format();
      expect(messages[0].content).toBe('更新后的消息');
    });
  });
});

