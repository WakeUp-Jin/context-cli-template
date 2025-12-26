/**
 * 评估函数 - 简化版本
 * 比较期望行为和实际执行数据
 */
import { TestCase, CollectedData, EvaluateResult } from './types.js';

/**
 * 评估函数
 * @param testCase 测试用例
 * @param actual 实际收集到的数据
 * @returns 评估结果
 */
export function evaluate(testCase: TestCase, actual: CollectedData): EvaluateResult {
  const expected = testCase.expected;

  // 1. 评估Agent调用
  const missedAgents = expected.agents.filter((a) => !actual.agents.includes(a));
  const extraAgents = actual.agents.filter((a) => !expected.agents.includes(a));
  const agentMatch = missedAgents.length === 0 && extraAgents.length === 0;

  // 2. 评估工具调用
  const missedTools: { agent: string; tool: string }[] = [];
  const extraTools: { agent: string; tool: string }[] = [];

  // 检查遗漏的工具
  for (const [agent, tools] of Object.entries(expected.tools)) {
    const actualTools = actual.tools[agent] || [];
    for (const tool of tools) {
      if (!actualTools.includes(tool)) {
        missedTools.push({ agent, tool });
      }
    }
  }

  // 检查多余的工具
  for (const [agent, tools] of Object.entries(actual.tools)) {
    const expectedTools = expected.tools[agent] || [];
    for (const tool of tools) {
      if (!expectedTools.includes(tool)) {
        extraTools.push({ agent, tool });
      }
    }
  }

  const toolMatch = missedTools.length === 0 && extraTools.length === 0;

  // 3. 综合判断
  const passed = agentMatch && toolMatch;

  return {
    passed,
    agentMatch,
    toolMatch,
    details: {
      agents: {
        expected: expected.agents,
        actual: actual.agents,
        missed: missedAgents,
        extra: extraAgents,
      },
      tools: {
        expected: expected.tools,
        actual: actual.tools,
        missed: missedTools,
        extra: extraTools,
      },
    },
  };
}

/**
 * 格式化评估结果为可读字符串
 */
export function formatResult(result: EvaluateResult): string {
  let output = '';

  // Agent评估
  if (result.agentMatch) {
    output += `✅ Agent调用正确\n`;
  } else {
    output += `❌ Agent调用错误\n`;
    output += `   期望: ${result.details.agents.expected.join(', ') || '无'}\n`;
    output += `   实际: ${result.details.agents.actual.join(', ') || '无'}\n`;
    if (result.details.agents.missed.length > 0) {
      output += `   遗漏: ${result.details.agents.missed.join(', ')}\n`;
    }
    if (result.details.agents.extra.length > 0) {
      output += `   多余: ${result.details.agents.extra.join(', ')}\n`;
    }
  }

  // 工具评估
  if (result.toolMatch) {
    output += `✅ 工具调用正确\n`;
  } else {
    output += `❌ 工具调用错误\n`;
    if (result.details.tools.missed.length > 0) {
      const missed = result.details.tools.missed.map((t) => `${t.agent}.${t.tool}`).join(', ');
      output += `   遗漏: ${missed}\n`;
    }
    if (result.details.tools.extra.length > 0) {
      const extra = result.details.tools.extra.map((t) => `${t.agent}.${t.tool}`).join(', ');
      output += `   多余: ${extra}\n`;
    }
  }

  return output;
}

