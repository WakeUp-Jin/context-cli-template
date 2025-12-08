/**
 * 多智能体对话示例
 * 演示 MainAgent 协调多个 SubAgent 完成任务
 */
import { createLLMService } from '../core/llm/index.js';
import { MainAgent } from '../core/agent/index.js';

async function main() {
  console.log('🚀 Multi-Agent Chat Example\n');

  // 创建 LLM 服务
  const service = await createLLMService({
    provider: 'deepseek',
    model: 'deepseek-chat',
  });

  // 创建多智能体系统 (MainAgent + SubAgents)
  const multiAgent = new MainAgent(service, 'main_agent');

  console.log('📋 任务: 分析如何提升代码质量\n');

  // 执行多智能体协作
  const result = await multiAgent.run('请帮我分析如何提升代码质量，并给出具体的改进建议');

  // 输出结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 执行结果汇总');
  console.log('='.repeat(60));

  console.log(`\n✅ 执行状态: ${result.success ? '成功' : '失败'}`);
  console.log(`🤖 参与的 Agent: ${result.agents.join(' → ')}`);

  console.log('\n📝 子 Agent 执行记录:');
  for (const subResult of result.subAgentResults) {
    console.log(`\n  [${subResult.agentName}]`);
    console.log(`  状态: ${subResult.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`  输出: ${subResult.result.slice(0, 200)}${subResult.result.length > 200 ? '...' : ''}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 最终响应');
  console.log('='.repeat(60));
  console.log(result.finalResponse);
}

main().catch(console.error);
