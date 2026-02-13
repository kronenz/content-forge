/**
 * @content-forge/agents
 * AI agent orchestration for ContentForge
 */

// Export types
export * from './types.js';

// Export infrastructure
export * from './lock-manager.js';
export * from './task-queue.js';
export * from './base-agent.js';

// Export agents
export * from './strategist-agent.js';
export * from './writer-agent.js';
export * from './guardian-agent.js';
export * from './collector-agent.js';
export * from './researcher-agent.js';
export * from './publisher-agent.js';
export * from './humanizer-agent.js';
export * from './visual-director-agent.js';
export * from './visual-prompt-templates.js';
export * from './video-producer-agent.js';
export * from './analyst-agent.js';
export * from './thumbnail-generator.js';

// Version
export const version = '0.1.0';
