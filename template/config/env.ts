/**
 * 环境变量配置管理
 *
 * 自动加载 .env 文件：
 * - 使用 dotenv 库自动加载环境变量
 * - 支持 Node.js 所有版本
 *
 * 优先级（从高到低）：
 * 1. .env.local (本地覆盖，不提交到 git)
 * 2. .env.{NODE_ENV} (环境特定配置，如 .env.production)
 * 3. .env (默认配置)
 *
 * 使用方式：
 * ```typescript
 * import { config } from './config/env.js';
 * console.log(config.llm.deepseek.apiKey);
 * ```
 */

import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

//加载环境变量文件
loadEnv();


/** 应用配置接口 */
export interface AppConfig {
  /** Node 环境 */
  nodeEnv: "development" | "production" | "test";

  /** 日志配置 */
  logging: {
    level: "debug" | "info" | "warn" | "error";
    enableConsole: boolean;
  };

  /** LLM 提供商配置 */
  llm: {
    /** DeepSeek 配置 */
    deepseek: {
      apiKey: string;
      baseURL?: string;
    };
  };

  /** 默认 LLM 配置 */
  defaultProvider: string;
}

/** 获取环境变量，支持默认值 */
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue!;
}

/** 获取环境变量布尔值 */
function getEnvBoolean(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/** 验证 NODE_ENV 值 */
function validateNodeEnv(env: string): "development" | "production" | "test" {
  if (["development", "production", "test"].includes(env)) {
    return env as "development" | "production" | "test";
  }
  console.warn(`Invalid NODE_ENV: ${env}, falling back to 'development'`);
  return "development";
}

/** 验证日志级别 */
function validateLogLevel(level: string): "debug" | "info" | "warn" | "error" {
  if (["debug", "info", "warn", "error"].includes(level)) {
    return level as "debug" | "info" | "warn" | "error";
  }
  console.warn(`Invalid LOG_LEVEL: ${level}, falling back to 'info'`);
  return "info";
}

/** 导出类型安全的配置对象 */
export const config: AppConfig = {
  nodeEnv: validateNodeEnv(getEnvVar("NODE_ENV", "development")),

  logging: {
    level: validateLogLevel(getEnvVar("LOG_LEVEL", "info")),
    enableConsole: getEnvBoolean("ENABLE_CONSOLE_LOG", true),
  },

  llm: {
    deepseek: {
      apiKey: getEnvVar("DEEPSEEK_API_KEY", ""),
      baseURL: getEnvVar("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
    },
  },

  defaultProvider: getEnvVar("DEFAULT_LLM_PROVIDER", "deepseek"),
};

/**
 * 获取指定提供商的配置
 * @param provider - LLM 提供商名称
 * @returns 提供商配置对象
 */
export function getLLMKeyByProvider(provider: string) {
  const providerKey = provider.toLowerCase();
  let apiKey = config.llm[providerKey].apiKey;
  if (!apiKey) {
    throw new Error(`API key for provider "${provider}" not found. `);
  }
  return apiKey;
}

export function loadEnv() {
  // 获取当前文件所在目录
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, "..");

  // 加载环境变量文件（按优先级）
  const nodeEnv = process.env.NODE_ENV || "development";

  // 1. 加载 .env.local（最高优先级）
  dotenvConfig({ path: resolve(projectRoot, ".env.local"), override: false });

  // 2. 加载 .env.{NODE_ENV}
  if (nodeEnv !== "development") {
    dotenvConfig({
      path: resolve(projectRoot, `.env.${nodeEnv}`),
      override: false,
    });
  }

  // 3. 加载 .env（默认配置）
  dotenvConfig({ path: resolve(projectRoot, ".env"), override: false });
}

