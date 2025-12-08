/**
 * 评估模块模板 - 类型定义
 * 简化版本，专注核心功能
 */

/**
 * 测试用例定义
 */
export interface TestCase {
  id: string; // 测试用例ID
  description: string; // 用例描述
  input: string; // 用户输入
  expected: ExpectedBehavior; // 期望结果
}

/**
 * 期望行为定义
 */
export interface ExpectedBehavior {
  // 期望调用的子Agent列表
  agents: string[];
  // 每个子Agent期望调用的工具
  tools: {
    [agentName: string]: string[];
  };
}

/**
 * 事件收集器收集到的实际执行数据
 */
export interface CollectedData {
  // 实际调用的子Agent列表
  agents: string[];
  // 每个Agent实际调用的工具
  tools: {
    [agentName: string]: string[];
  };
  // 编辑节点执行结果
  editResult: {
    success: number;
    fail: number;
  } | null;
}

/**
 * 评估结果
 */
export interface EvaluateResult {
  passed: boolean; // 是否通过
  agentMatch: boolean; // Agent调用是否匹配
  toolMatch: boolean; // 工具调用是否匹配

  // 详细信息
  details: {
    agents: {
      expected: string[];
      actual: string[];
      missed: string[]; // 遗漏的Agent
      extra: string[]; // 多余的Agent
    };
    tools: {
      expected: { [agentName: string]: string[] };
      actual: { [agentName: string]: string[] };
      missed: { agent: string; tool: string }[];
      extra: { agent: string; tool: string }[];
    };
  };
}

