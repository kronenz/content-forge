/**
 * E2E Integration Test - Full ContentForge Pipeline
 */

import { describe, it, expect } from 'vitest';
import { type Material, type RawContent, type ChannelContent } from '@content-forge/core';
import { TextPipeline } from '@content-forge/pipelines';
import { StrategistAgent, WriterAgent, GuardianAgent } from '@content-forge/agents';

// Test the full flow: Material → Strategist → Pipeline → Guardian
describe('E2E: Content Pipeline', () => {
  const sampleMaterial: Material = {
    id: 'e2e-test-1',
    source: 'test',
    url: 'https://example.com/test-article',
    title: 'Understanding AI Agents in Production',
    content: `Artificial intelligence agents are becoming increasingly important in production systems.
    These agents can automate complex tasks, make decisions, and interact with various APIs.
    In this article, we explore how AI agents work, their architecture patterns, and best practices
    for deploying them in production environments. Key considerations include reliability,
    observability, and graceful degradation. Modern AI agents leverage large language models
    for reasoning and tool use, while maintaining strict safety guardrails.`,
    score: 8,
    tags: ['ai', 'agents', 'production'],
    status: 'scored',
    collectedAt: new Date(),
    createdAt: new Date(),
  };

  it('should transform material through text pipeline to 3 channels', async () => {
    const rawContent: RawContent = {
      material: sampleMaterial,
      pipelineType: 'text',
      targetChannels: ['medium', 'linkedin', 'x-thread'],
    };

    const pipeline = new TextPipeline();
    const result = await pipeline.process(rawContent);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3);

      const channels = result.value.map(c => c.channel);
      expect(channels).toContain('medium');
      expect(channels).toContain('linkedin');
      expect(channels).toContain('x-thread');
    }
  });

  it('should validate content through guardian agent', async () => {
    // First generate content
    const rawContent: RawContent = {
      material: sampleMaterial,
      pipelineType: 'text',
      targetChannels: ['medium', 'linkedin'],
    };

    const pipeline = new TextPipeline();
    const pipelineResult = await pipeline.process(rawContent);
    expect(pipelineResult.ok).toBe(true);
    if (!pipelineResult.ok) return;

    // Then validate each through guardian
    const guardian = new GuardianAgent({ id: 'guardian-e2e', name: 'guardian', type: 'guardian' });

    for (const content of pipelineResult.value) {
      const task = {
        id: `e2e-guardian-${content.channel}`,
        type: 'guardian',
        status: 'pending' as const,
        agentId: 'guardian-e2e',
        input: { content },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await guardian.run(task);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(true);
      }
    }
  });

  it('should run full strategist → writer → guardian flow', async () => {
    // Step 1: Strategist selects materials
    const strategist = new StrategistAgent({ id: 'strategist-e2e', name: 'strategist', type: 'strategist' });

    const strategistTask = {
      id: 'e2e-strategist',
      type: 'strategist',
      status: 'pending' as const,
      agentId: 'strategist-e2e',
      input: { materials: [sampleMaterial] },
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };

    const strategistResult = await strategist.run(strategistTask);
    expect(strategistResult.ok).toBe(true);

    // Step 2: Writer transforms for a channel
    const writer = new WriterAgent({ id: 'writer-e2e', name: 'writer', type: 'writer' });

    const writerTask = {
      id: 'e2e-writer',
      type: 'writer',
      status: 'pending' as const,
      agentId: 'writer-e2e',
      input: { material: sampleMaterial, channel: 'medium' },
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };

    const writerResult = await writer.run(writerTask);
    expect(writerResult.ok).toBe(true);

    // Step 3: Guardian validates
    if (writerResult.ok) {
      const writerOutput = writerResult.value.result as { content: ChannelContent };

      const guardian = new GuardianAgent({ id: 'guardian-e2e', name: 'guardian', type: 'guardian' });
      const guardianTask = {
        id: 'e2e-guardian',
        type: 'guardian',
        status: 'pending' as const,
        agentId: 'guardian-e2e',
        input: { content: writerOutput.content },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const guardianResult = await guardian.run(guardianTask);
      expect(guardianResult.ok).toBe(true);
    }
  });
});
