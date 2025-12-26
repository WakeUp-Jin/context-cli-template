/**
 * 评估模块使用示例
 * 展示如何使用 SimpleAgent 和 MultiAgent 进行测试
 */
import { eventBus } from './EventBus.js';
import { evaluate, formatResult } from './evaluate.js';
import {
  TEST_CASES,
  getTestById,
  getSimpleAgentTests,
  getMultiAgentTests,
} from './dataset.js';
import { TestCase, EvaluateResult } from './types.js';
import { SimpleAgent, MainAgent } from '../core/agent/index.js';
import { createLLMService } from '../core/llm/index.js';
import { ILLMService } from '../core/llm/types/index.js';

// 缓存 LLM 服务和 Agent 实例
let llmService: ILLMService | null = null;
let simpleAgent: SimpleAgent | null = null;
let multiAgent: MainAgent | null = null;

/**
 * 获取 LLM 服务（延迟初始化）
 */
async function getLLMService(): Promise<ILLMService> {
  if (!llmService) {
    llmService = await createLLMService({
      provider: 'deepseek',
      model: "deepseek-chat",
    });
  }
  return llmService;
}

/**
 * 获取 SimpleAgent 实例
 */
async function getSimpleAgent(): Promise<SimpleAgent> {
  if (!simpleAgent) {
    const service = await getLLMService();
    simpleAgent = new SimpleAgent(service, { name: 'simple_agent' });
  }
  return simpleAgent;
}

/**
 * 获取 MultiAgent (MainAgent) 实例
 */
async function getMultiAgent(): Promise<MainAgent> {
  if (!multiAgent) {
    const service = await getLLMService();
    multiAgent = new MainAgent(service, 'main_agent');
  }
  return multiAgent;
}

/**
 * 判断测试用例是否为多 Agent 测试
 */
function isMultiAgentTest(testCase: TestCase): boolean {
  return testCase.id.startsWith('M');
}

/**
 * 运行单个测试用例
 */
async function runTest(testCase: TestCase): Promise<EvaluateResult | null> {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 测试: ${testCase.id} - ${testCase.description}`);
  console.log(`${'='.repeat(50)}`);

  const startTime = Date.now();

  try {
    let agents: string[];
    let tools: Record<string, string[]>;
    let finalResponse: string;
    let success: boolean;
    let error: string | undefined;

    if (isMultiAgentTest(testCase)) {
      // 多 Agent 测试
      const agent = await getMultiAgent();
      const result = await agent.run(testCase.input);
      agents = result.agents;
      tools = result.tools;
      finalResponse = result.finalResponse;
      success = result.success;
      error = result.error;
    } else {
      // 单 Agent 测试
      const agent = await getSimpleAgent();
      const result = await agent.run(testCase.input);
      agents = result.agents;
      tools = result.tools;
      finalResponse = result.finalResponse;
      success = result.success;
      error = result.error;
    }

    // 评估
    const evalResult = evaluate(testCase, {
      agents,
      tools,
      editResult: null,
    });

    // 输出结果
    const status = evalResult.passed ? '✅ PASS' : '❌ FAIL';
    const time = Date.now() - startTime;
    console.log(`\n${status} (${time}ms)`);
    console.log(formatResult(evalResult));

    const responsePreview = finalResponse.slice(0, 200);
    console.log(`\n📝 Agent回复: ${responsePreview}${finalResponse.length > 200 ? '...' : ''}`);

    if (!success) {
      console.log(`\n⚠️ Agent 执行失败: ${error}`);
    }

    return evalResult;
  } catch (err) {
    console.error(`❌ 执行失败:`, err);
    return null;
  }
}

/**
 * 运行测试集
 */
async function runTests(testCases: TestCase[], title: string) {
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# ${title}: ${testCases.length} 个用例`);
  console.log(`${'#'.repeat(60)}`);

  const results: Array<{ testCase: TestCase; result: EvaluateResult }> = [];
  const startTime = Date.now();

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result) {
      results.push({ testCase, result });
    }
  }

  // 汇总
  const passed = results.filter((r) => r.result.passed).length;
  const failed = results.length - passed;
  const totalTime = Date.now() - startTime;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${title} 完成`);
  console.log(`${'='.repeat(60)}`);
  console.log(`总数: ${results.length}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⏱️  耗时: ${(totalTime / 1000).toFixed(2)}s`);

  return results;
}

/**
 * 运行所有测试用例
 */
async function runAllTests() {
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# 开始全量测试: ${TEST_CASES.length} 个用例`);
  console.log(`${'#'.repeat(60)}`);

  const startTime = Date.now();

  // 运行单 Agent 测试
  const simpleResults = await runTests(getSimpleAgentTests(), '单 Agent 测试');

  // 运行多 Agent 测试
  const multiResults = await runTests(getMultiAgentTests(), '多 Agent 测试');

  // 总汇总
  const allResults = [...simpleResults, ...multiResults];
  const passed = allResults.filter((r) => r.result.passed).length;
  const failed = allResults.length - passed;
  const totalTime = Date.now() - startTime;

  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# 全部测试完成`);
  console.log(`${'#'.repeat(60)}`);
  console.log(`总数: ${allResults.length}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⏱️  总耗时: ${(totalTime / 1000).toFixed(2)}s`);
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
评估模块使用说明:

  npx ts-node example.ts [选项]

选项:
  --help                显示帮助信息
  --test <id>           运行指定测试用例 (如: S1, M1)
  --simple              运行单 Agent 测试集 (2 个用例)
  --multi               运行多 Agent 测试集 (3 个用例)
  (无参数)              运行所有测试用例

测试用例 ID:
  S1, S2                单 Agent 测试 (SimpleAgent)
  M1, M2, M3            多 Agent 测试 (MultiAgent)
`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    printHelp();
  } else if (args.includes('--simple')) {
    // 运行单 Agent 测试集
    await runTests(getSimpleAgentTests(), '单 Agent 测试');
  } else if (args.includes('--multi')) {
    // 运行多 Agent 测试集
    await runTests(getMultiAgentTests(), '多 Agent 测试');
  } else if (args.includes('--test') && args[args.indexOf('--test') + 1]) {
    // 运行指定测试用例
    const testId = args[args.indexOf('--test') + 1];
    const testCase = getTestById(testId);
    if (testCase) {
      await runTest(testCase);
    } else {
      console.error(`未找到测试用例: ${testId}`);
      console.log('可用的测试用例 ID: S1, S2, M1, M2, M3');
    }
  } else {
    // 运行所有测试
    await runAllTests();
  }
}

// 运行
main().catch(console.error);
