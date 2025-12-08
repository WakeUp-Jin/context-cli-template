/**
 * 通用测试数据集
 * 包含单 Agent 和多 Agent 的测试用例
 */
import { TestCase } from './types.js';

/**
 * 单 Agent 测试用例 (SimpleAgent)
 */
export const SIMPLE_AGENT_TESTS: TestCase[] = [
  // S1. 单工具测试 - 列出文件
  {
    id: 'S1',
    description: '单工具调用 - 列出当前目录文件',
    input: '列出当前目录下的所有文件和文件夹',
    expected: {
      agents: ['simple_agent'],
      tools: { simple_agent: ['list_files'] },
    },
  },

  // S2. 多工具测试 - 先列出再读取
  {
    id: 'S2',
    description: '多工具调用 - 列出文件后读取',
    input: '先列出当前目录的文件，然后读取 README.md 的内容',
    expected: {
      agents: ['simple_agent'],
      tools: { simple_agent: ['list_files', 'read_file'] },
    },
  },
];

/**
 * 多 Agent 测试用例 (MultiAgent: MainAgent + SubAgents)
 */
export const MULTI_AGENT_TESTS: TestCase[] = [
  // M1. 简单任务分发 - 主Agent协调子Agent
  {
    id: 'M1',
    description: '多Agent协调 - 简单任务分发',
    input: '帮我分析一下如何提升代码质量',
    expected: {
      agents: ['main_agent', 'researcher', 'executor'],
      tools: {
        main_agent: [],
        researcher: [],
        executor: [],
      },
    },
  },

  // M2. 研究+执行 - 调用 researcher 和 executor
  {
    id: 'M2',
    description: '多Agent协调 - 研究与执行',
    input: '请研究并提供一个实现用户认证系统的方案',
    expected: {
      agents: ['main_agent', 'researcher', 'executor'],
      tools: {
        main_agent: [],
        researcher: [],
        executor: [],
      },
    },
  },

  // M3. 复杂任务 - 多轮子Agent协作
  {
    id: 'M3',
    description: '多Agent协调 - 复杂任务处理',
    input: '帮我设计一个完整的电商系统架构，包括技术选型和实施计划',
    expected: {
      agents: ['main_agent', 'researcher', 'executor'],
      tools: {
        main_agent: [],
        researcher: [],
        executor: [],
      },
    },
  },
];

/**
 * 所有测试用例
 */
export const TEST_CASES: TestCase[] = [...SIMPLE_AGENT_TESTS, ...MULTI_AGENT_TESTS];

/**
 * 根据ID获取测试用例
 */
export function getTestById(id: string): TestCase | undefined {
  return TEST_CASES.find((test) => test.id === id);
}

/**
 * 获取单Agent测试用例
 */
export function getSimpleAgentTests(): TestCase[] {
  return SIMPLE_AGENT_TESTS;
}

/**
 * 获取多Agent测试用例
 */
export function getMultiAgentTests(): TestCase[] {
  return MULTI_AGENT_TESTS;
}
