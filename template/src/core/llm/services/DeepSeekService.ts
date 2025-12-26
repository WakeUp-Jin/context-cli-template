import OpenAI from 'openai';
import {
  ILLMService,
  LLMResponse,
  LLMChatOptions,
  ImageData,
  ToolSet,
  UnifiedToolManager,
} from '../types/index.js';
import { logger } from '../../../utils/logger.js';
import { sleep } from '../utils/helpers.js';

/**
 * DeepSeek LLM 服务
 * 使用 OpenAI SDK（DeepSeek 兼容 OpenAI API）
 * 
 * 提供两种使用方式：
 * 1. complete() - 上下文补全（推荐）
 * 2. generate() - 内置工具调用循环（可选）
 */
export class DeepSeekService implements ILLMService {
  private client: OpenAI;
  private model: string;
  private maxRetries: number;
  private toolManager?: UnifiedToolManager;
  private maxIterations: number;

  constructor(
    openai: OpenAI,
    model: string,
    options?: {
      baseURL?: string;
      maxRetries?: number;
      toolManager?: UnifiedToolManager;
      maxIterations?: number;
    }
  ) {
    this.client = openai;
    this.model = model;
    this.maxRetries = options?.maxRetries || 3;
    this.toolManager = options?.toolManager;
    this.maxIterations = options?.maxIterations || 5;

    logger.debug(`初始化 DeepSeekService: model=${model}`);
  }

  /**
   * 核心方法：上下文补全
   * 接收格式化的上下文（消息历史），返回模型响应
   * @param messages - 上下文消息列表
   * @param tools - 可用的工具定义列表
   * @param options - 生成参数（temperature, maxTokens 等）
   * @returns 模型响应（包含内容、工具调用、使用统计）
   */
  async complete(
    messages: any[],
    tools?: any[],
    options?: LLMChatOptions
  ): Promise<LLMResponse> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      attempt++;

      try {
        logger.debug(
          `调用 DeepSeek API (尝试 ${attempt}/${this.maxRetries}): ${messages.length} 条消息, ${tools?.length || 0} 个工具`
        );

        const response = await this.client.chat.completions.create({
          model: this.model,
          messages,
          tools: tools && tools.length > 0 ? tools : undefined,
          tool_choice: options?.toolChoice,
          temperature: options?.temperature,
          max_tokens: options?.maxTokens,
          top_p: options?.topP,
          frequency_penalty: options?.frequencyPenalty,
          presence_penalty: options?.presencePenalty,
          stop: options?.stop,
          response_format: options?.responseFormat,
        });

        const message = response.choices[0]?.message;
        if (!message) {
          throw new Error('DeepSeek API 返回空响应');
        }

        const result: LLMResponse = {
          content: message.content || '',
          toolCalls: message.tool_calls as any,
          finishReason: response.choices[0]?.finish_reason,
          usage: response.usage
            ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              }
            : undefined,
        };

        logger.debug(
          `DeepSeek 响应: ${result.content.slice(0, 100)}${result.content.length > 100 ? '...' : ''}, 工具调用: ${result.toolCalls?.length || 0}`
        );

        return result;
      } catch (error: any) {
        logger.error(
          `DeepSeek API 调用失败 (${attempt}/${this.maxRetries}): ${error.message}`
        );

        if (attempt >= this.maxRetries) {
          throw new Error(`DeepSeek API 调用失败: ${error.message}`);
        }

        // 指数退避
        const delay = 500 * attempt;
        logger.debug(`等待 ${delay}ms 后重试...`);
        await sleep(delay);
      }
    }

    throw new Error('Unreachable');
  }

  /**
   * 简单对话：无工具，单次调用
   * @param userInput - 用户输入
   * @param systemPrompt - 可选的系统提示词
   */
  async simpleChat(userInput: string, systemPrompt?: string): Promise<string> {
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: userInput });

    const response = await this.complete(messages);
    return response.content;
  }

  /**
   * 获取配置信息
   */
  getConfig(): { provider: string; model: string } {
    return {
      provider: 'deepseek',
      model: this.model,
    };
  }

  /**
   * 完整方法：支持工具调用循环
   * 需要在构造时传入 toolManager
   * @param userInput - 用户输入
   * @param imageData - 可选的图片数据
   * @param _stream - 是否流式输出（暂未实现）
   */
  async generate(
    userInput: string,
    imageData?: ImageData,
    _stream?: boolean
  ): Promise<string> {
    if (!this.toolManager) {
      throw new Error(
        'generate() 方法需要 toolManager，请在构造时传入或使用 chat() 方法'
      );
    }

    // 初始化消息列表
    const messages: any[] = [
      {
        role: 'system',
        content: '你是一个有帮助的 AI 助手，可以使用工具来完成任务。',
      },
    ];

    // 添加用户消息
    const userMessage: any = { role: 'user', content: userInput };
    if (imageData) {
      userMessage.content = [
        { type: 'text', text: userInput },
        imageData.url
          ? { type: 'image_url', image_url: { url: imageData.url } }
          : {
              type: 'image_url',
              image_url: {
                url: `data:${imageData.mimeType || 'image/png'};base64,${imageData.base64}`,
              },
            },
      ];
    }
    messages.push(userMessage);

    // 获取可用工具
    const availableTools = await this.toolManager.getToolsForProvider(
      'deepseek'
    );

    // 工具调用循环
    let iteration = 0;
    while (iteration < this.maxIterations) {
      iteration++;
      logger.debug(`工具调用迭代: ${iteration}/${this.maxIterations}`);

      // 调用 LLM
      const response = await this.complete(messages, availableTools, {
        toolChoice: iteration === 1 ? 'auto' : undefined,
      });

      // 无工具调用，返回结果
      if (!response.toolCalls || response.toolCalls.length === 0) {
        logger.debug('无工具调用，返回最终结果');
        return response.content;
      }

      // 记录思考内容
      if (response.content) {
        logger.info(`💭 助手思考: ${response.content}`);
      }

      // 添加助手消息（包含工具调用）
      messages.push({
        role: 'assistant',
        content: response.content || null,
        tool_calls: response.toolCalls,
      });

      // 执行所有工具调用
      for (const toolCall of response.toolCalls) {
        if (toolCall.type !== 'function' || !toolCall.function) {
          continue;
        }

        logger.info(`🔧 使用工具: ${toolCall.function.name}`);

        try {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await this.toolManager.executeTool(
            toolCall.function.name,
            args
          );

          logger.info(`✅ 工具执行成功: ${JSON.stringify(result).slice(0, 200)}`);

          // 添加工具执行结果
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        } catch (error: any) {
          logger.error(`❌ 工具执行失败: ${error.message}`);

          // 添加错误结果
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message }),
          });
        }
      }
    }

    throw new Error(`达到最大迭代次数 (${this.maxIterations})`);
  }

  /**
   * 获取所有可用工具
   */
  async getAllTools(): Promise<ToolSet> {
    if (!this.toolManager) {
      return {};
    }
    return this.toolManager.getAllTools();
  }

  /**
   * 流式对话（预留接口）
   * TODO: 实现流式响应
   */
  async chatStream(
    messages: any[],
    tools?: any[],
    options?: LLMChatOptions
  ): Promise<AsyncIterable<LLMResponse>> {
    throw new Error('流式响应暂未实现');
  }
}

