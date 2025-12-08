/**
 * Agent 模块统一导出
 */

export { SimpleAgent } from './SimpleAgent.js';
export type { AgentResult, AgentConfig } from './SimpleAgent.js';

export { MainAgent, SubAgent, createMultiAgentSystem } from './MultiAgent.js';
export type { MainAgentResult, SubAgentResult } from './MultiAgent.js';
