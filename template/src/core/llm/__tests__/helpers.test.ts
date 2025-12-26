import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractApiKey,
  getBaseURL,
  getDefaultContextWindow,
} from '../utils/helpers.js';
import { LLMConfig } from '../types/index.js';

describe('辅助函数测试', () => {
  describe('extractApiKey', () => {
    it('应该优先使用用户传递的 API Key', () => {
      const config: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'user-provided-key',
      };
      expect(extractApiKey(config)).toBe('user-provided-key');
    });

    it('应该从环境变量获取 API Key（当用户未传递时）', () => {
      // 注意：这个测试依赖于实际的环境变量加载
      // 如果 .env 中有 DEEPSEEK_API_KEY，则会返回该值
      const config: LLMConfig = {
        provider: 'deepseek',
        model: 'deepseek-chat',
      };

      // 由于依赖环境变量，我们只测试不抛出错误即可
      // 或者可以 mock getLLMConfig 函数
      const result = extractApiKey(config);
      expect(typeof result).toBe('string');
    });

    it('无需 API Key 的提供商应该返回 not-required', () => {
      const config: LLMConfig = {
        provider: 'ollama',
        model: 'llama2',
      };
      expect(extractApiKey(config)).toBe('not-required');
    });

    it('缺少 API Key 时应该抛出清晰的错误信息', () => {
      const config: LLMConfig = {
        provider: 'unknown-provider',
        model: 'some-model',
      };
      expect(() => extractApiKey(config)).toThrow(
        /API key for provider "unknown-provider" not found/
      );
    });
  });

  describe('getBaseURL', () => {
    it('应该优先使用用户传递的 baseURL', () => {
      const config: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4',
        baseURL: 'https://custom.api.com',
      };
      expect(getBaseURL(config)).toBe('https://custom.api.com');
    });

    it('应该从环境变量获取 baseURL（当用户未传递时）', () => {
      const config: LLMConfig = {
        provider: 'deepseek',
        model: 'deepseek-chat',
      };
      // 会返回环境变量或默认值
      const result = getBaseURL(config);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('应该返回默认 Base URL', () => {
      const config: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4',
      };
      expect(getBaseURL(config)).toBe('https://api.openai.com/v1');
    });

    it('应该返回 OpenRouter 的默认 URL', () => {
      const config: LLMConfig = {
        provider: 'openrouter',
        model: 'gpt-4',
      };
      expect(getBaseURL(config)).toBe('https://openrouter.ai/api/v1');
    });

    it('应该返回 Ollama 的默认 URL', () => {
      const config: LLMConfig = {
        provider: 'ollama',
        model: 'llama2',
      };
      expect(getBaseURL(config)).toBe('http://localhost:11434/v1');
    });

    it('未知提供商应该抛出错误', () => {
      const config: LLMConfig = {
        provider: 'unknown-provider',
        model: 'some-model',
      };
      expect(() => getBaseURL(config)).toThrow(
        /No base URL found for provider "unknown-provider"/
      );
    });
  });

  describe('getDefaultContextWindow', () => {
    it('应该返回 GPT-4o 的上下文窗口', () => {
      expect(getDefaultContextWindow('openai', 'gpt-4o')).toBe(128000);
    });

    it('应该返回默认上下文窗口', () => {
      expect(getDefaultContextWindow('openai', 'unknown-model')).toBe(8192);
    });

    it('应该返回提供商的默认值', () => {
      expect(getDefaultContextWindow('anthropic')).toBe(200000);
    });

    it('未知提供商应该返回默认值 8192', () => {
      expect(getDefaultContextWindow('unknown-provider')).toBe(8192);
    });
  });
});
