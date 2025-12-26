import { BaseContext } from '../base/BaseContext.js';
import { ContextType, ConversationMessage } from '../types.js';

/**
 * 会话上下文管理类
 * 负责管理用户和助手之间的对话历史
 */
export class ConversationContext extends BaseContext<ConversationMessage> {
  constructor() {
    super(ContextType.CONVERSATION_HISTORY);
  }

  /**
   * 格式化为 LLM 消息格式
   * 转换为标准的 OpenAI 消息格式
   */
  format(): any[] {
    return this.items.map((item) => {
      const message = item.content;
      const formatted: any = {
        role: message.role,
        content: message.content,
      };

      // 添加图片数据（如果存在）
      if (message.imageData) {
        if (message.imageData.url) {
          formatted.content = [
            { type: 'text', text: message.content },
            {
              type: 'image_url',
              image_url: { url: message.imageData.url },
            },
          ];
        } else if (message.imageData.base64) {
          formatted.content = [
            { type: 'text', text: message.content },
            {
              type: 'image_url',
              image_url: {
                url: `data:${message.imageData.mimeType || 'image/png'};base64,${message.imageData.base64}`,
              },
            },
          ];
        }
      }

      // 添加工具调用（如果存在）
      if (message.toolCalls && message.toolCalls.length > 0) {
        formatted.tool_calls = message.toolCalls;
      }

      // 添加工具调用 ID（如果是工具消息）
      if (message.role === 'tool' && item.metadata?.toolCallId) {
        formatted.tool_call_id = item.metadata.toolCallId;
      }

      return formatted;
    });
  }
}
