import { ILLMService, LLMConfig, UnifiedToolManager } from './types/index.js';
import { DeepSeekService } from './services/DeepSeekService.js';
import { extractApiKey, getBaseURL } from './utils/helpers.js';

/**
 * 公共工厂函数：创建 LLM 服务实例（支持可选的工具管理器）
 *
 * @param config - LLM 配置（包括 provider、model、apiKey 等）
 * @param toolManager - 可选的工具管理器实例
 * @param eventManager - 可选的事件管理器实例
 * @returns Promise<ILLMService> 实例
 *
 * @example
 * ```typescript
 * import { ToolManager } from '../tool/ToolManager.js';
 *
 * const toolManager = new ToolManager();
 * const service = await createLLMService(
 *   {
 *     provider: 'deepseek',
 *     model: 'deepseek-chat',
 *     apiKey: 'your-api-key',
 *     maxIterations: 10
 *   },
 *   toolManager
 * );
 *
 * // 使用服务
 * const response = await service.complete(messages, tools);
 * ```
 */
export async function createLLMService(
  config: LLMConfig,
  toolManager?: UnifiedToolManager,
  eventManager?: any
): Promise<ILLMService> {
  // 1. 创建服务实例
  const service = await _createLLMService(config, toolManager);

  // 2. 设置事件管理器（如果提供且服务支持）
  if (eventManager && typeof (service as any).setEventManager === 'function') {
    (service as any).setEventManager(eventManager);
  }

  return service;
}

/**
 * 内部函数：创建 LLM 服务实例
 */
async function _createLLMService(
  config: LLMConfig,
  toolManager?: UnifiedToolManager
): Promise<ILLMService> {
  // 1. 提取和验证 API Key
  const apiKey = extractApiKey(config);

  // 2. 获取 Base URL
  const baseURL = getBaseURL(config);

  // 3. 根据 provider 创建服务
  switch (config.provider.toLowerCase()) {
    case 'deepseek': {
      // 使用 ES 动态导入 OpenAI SDK
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey, baseURL });

      return new DeepSeekService(
        openai,
        config.model || 'deepseek-chat',
        {
          baseURL,
          maxRetries: 3,
          toolManager,
          maxIterations: config.maxIterations || 5,
        }
      );
    }

    // 🟡 可扩展：其他提供商
    // case 'openai':
    // case 'anthropic':
    // case 'qwen':
    // case 'siliconflow':
    // case 'openrouter':

    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}
