/**
 * .env.example 生成器
 */

export function generateEnvExample(): string {
  return `# DeepSeek API Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Other LLM Providers (Optional)
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# QWEN_API_KEY=

# Application Configuration
NODE_ENV=development
LOG_LEVEL=debug

# (Future) Server Configuration
# PORT=3000
# HOST=localhost
`;
}
