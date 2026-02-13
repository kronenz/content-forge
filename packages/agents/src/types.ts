/**
 * Agent-specific types
 */

export interface AgentError {
  agent: string;
  message: string;
  cause?: unknown;
}

export interface TaskOutput {
  agentId: string;
  taskId: string;
  result: Record<string, unknown>;
  completedAt: Date;
}

export interface LockConfig {
  lockKey: string;
  ttlMs: number;
}

export interface LockError {
  key: string;
  message: string;
  owner?: string;
}
