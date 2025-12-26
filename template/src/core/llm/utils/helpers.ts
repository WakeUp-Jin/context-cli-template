import { LLMConfig } from "../types/index.js";
import {
  config as envConfig,
  getLLMKeyByProvider,
} from "../../../config/env.js";

/**
 * 提取 API Key
 *
 * 优先级（从高到低）：
 * 1. 用户传递的 config.apiKey（显式配置）
 * 2. 环境变量中的配置（通过 provider 自动查找）
 * 3. 如果都没有且该 provider 需要 API Key，则抛出错误
 *
 * @param config - LLM 配置
 * @returns API Key 字符串
 */
export function extractApiKey(config: LLMConfig): string {
  const provider = config.provider.toLowerCase();

  // 无需 API Key 的提供商
  if (["ollama", "lmstudio", "aws"].includes(provider)) {
    return "not-required";
  }

  // 1. 优先使用用户传递的 API Key
  if (config.apiKey) {
    return config.apiKey;
  }

  // 2. 尝试从环境变量配置中获取
  const providerConfigKey = getLLMKeyByProvider(provider);
  return providerConfigKey;
}

/**
 * 获取提供商的 Base URL
 *
 * 优先级（从高到低）：
 * 1. 用户传递的 config.baseURL（显式配置）
 * 2. 环境变量中的配置（通过 provider 自动查找）
 * 3. 硬编码的默认 Base URL
 *
 * @param config - LLM 配置
 * @returns Base URL 字符串
 *
 */
export function getBaseURL(config: LLMConfig): string {
  // 1. 优先使用用户传递的 baseURL
  if (config.baseURL) {
    return config.baseURL;
  }

  const provider = config.provider.toLowerCase();

  // 3. 硬编码的默认 Base URL（兜底）
  const defaultBaseURLs: Record<string, string> = {
    deepseek: "https://api.deepseek.com",
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com",
    siliconflow: "https://api.siliconflow.cn/v1",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    openrouter: "https://openrouter.ai/api/v1",
    ollama: "http://localhost:11434/v1",
    lmstudio: "http://localhost:1234/v1",
  };

  const baseURL = defaultBaseURLs[provider];
  if (!baseURL) {
    throw new Error(
      `No base URL found for provider "${provider}". ` +
        `Please pass baseURL in config: { provider: '${provider}', model: '...', baseURL: 'https://...' }`
    );
  }

  return baseURL;
}

/** 获取默认上下文窗口大小 */
export function getDefaultContextWindow(
  provider: string,
  model?: string
): number {
  const defaults: Record<string, Record<string, number>> = {
    openai: {
      "gpt-4o": 128000,
      "gpt-4": 8192,
      "gpt-3.5-turbo": 16385,
      default: 8192,
    },
    anthropic: { default: 200000 },
    gemini: { default: 1000000 },
    deepseek: { default: 128000 },
    ollama: { default: 8192 },
  };

  const providerDefaults = defaults[provider.toLowerCase()] || {
    default: 8192,
  };
  return providerDefaults[model || "default"] || providerDefaults.default;
}

/** 睡眠函数 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 深度解析参数：递归检查字符串类型的参数值，尝试 JSON 解析
 * 用于处理 Claude 等模型返回嵌套 JSON 字符串的情况
 *
 * 例如：{ bgmRequests: "[{...}]" } → { bgmRequests: [{...}] }
 */
export function deepParseArgs(args: any): any {
  if (typeof args === "string") {
    // 尝试解析看起来像 JSON 数组或对象的字符串
    const trimmed = args.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      // 第一次尝试：直接解析
      try {
        const parsed = JSON.parse(trimmed);
        console.log("[deepParseArgs] ✅ 第一次尝试解析成功");
        return deepParseArgs(parsed);
      } catch (e) {
        console.log(
          "[deepParseArgs] ❌ 第一次尝试解析失败:",
          (e as Error).message
        );
        console.log(
          "[deepParseArgs] 字符串前100字符:",
          trimmed.substring(0, 100)
        );

        // 第二次尝试：处理 Claude 模型返回的双重转义问题
        // 将 \\n 转换为 \n，\\\" 转换为 \"
        try {
          const unescaped = trimmed
            .replace(/\\\\n/g, "\\n")
            .replace(/\\\\"/g, '\\"');
          console.log("[deepParseArgs] 尝试处理双重转义后解析...");
          const parsed = JSON.parse(unescaped);
          console.log("[deepParseArgs] ✅ 第二次尝试（处理转义后）解析成功");
          return deepParseArgs(parsed);
        } catch (e2) {
          console.log(
            "[deepParseArgs] ❌ 第二次尝试也失败:",
            (e2 as Error).message
          );
          // 都失败了，返回原始字符串
          return args;
        }
      }
    }
    return args;
  }

  if (Array.isArray(args)) {
    return args.map(deepParseArgs);
  }

  if (args && typeof args === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(args)) {
      result[key] = deepParseArgs(value);
    }
    return result;
  }

  return args;
}
