/**
 * 简单对话示例
 */
import { createLLMService } from "../core/llm/index.js";

async function main() {
  // 创建 LLM 服务
  const service = await createLLMService({
    provider: "deepseek",
    model: "deepseek-chat",
  });

  console.log("🚀 Simple Chat Example\n");

  // 简单对话
  const response = await service.simpleChat(
    "你好！你能用一句话介绍一下自己吗？",
    "你是一个有用的AI助手。"
  );

  console.log("Assistant:", response);
}

main().catch(console.error);
