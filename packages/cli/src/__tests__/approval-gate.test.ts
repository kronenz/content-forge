/**
 * Approval Gate Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Channel, ChannelContent } from '@content-forge/core';

// Mock readline/promises before importing
vi.mock('node:readline/promises', () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mock publishers
vi.mock('@content-forge/publishers', () => {
  const mockPublish = vi.fn();
  const MockPublisher = vi.fn(() => ({ publish: mockPublish }));
  return {
    MediumPublisher: MockPublisher,
    LinkedInPublisher: MockPublisher,
    XThreadPublisher: MockPublisher,
    BasePublisher: class {},
  };
});

describe('parseFlags', () => {
  let parseFlags: typeof import('../cli.js').parseFlags;

  beforeEach(async () => {
    const mod = await import('../cli.js');
    parseFlags = mod.parseFlags;
  });

  it('should parse --publish flag', () => {
    const flags = parseFlags(['input.md', '--publish']);
    expect(flags.publish).toBe(true);
    expect(flags.inputFile).toBe('input.md');
  });

  it('should parse --yes flag', () => {
    const flags = parseFlags(['input.md', '--publish', '--yes']);
    expect(flags.publish).toBe(true);
    expect(flags.yes).toBe(true);
  });

  it('should parse output directory positional arg', () => {
    const flags = parseFlags(['input.md', './custom-output']);
    expect(flags.inputFile).toBe('input.md');
    expect(flags.outputDir).toBe('./custom-output');
  });

  it('should default outputDir to ./output', () => {
    const flags = parseFlags(['input.md']);
    expect(flags.outputDir).toBe('./output');
  });

  it('should parse --help flag', () => {
    const flags = parseFlags(['--help']);
    expect(flags.help).toBe(true);
  });
});

describe('promptApproval', () => {
  let promptApproval: typeof import('../cli.js').promptApproval;
  let mockCreateInterface: any;

  beforeEach(async () => {
    vi.resetModules();

    const mockQuestion = vi.fn();
    const mockClose = vi.fn();
    mockCreateInterface = vi.fn(() => ({
      question: mockQuestion,
      close: mockClose,
    }));

    vi.doMock('node:readline/promises', () => ({
      createInterface: mockCreateInterface,
    }));

    // Re-mock publishers for fresh module
    vi.doMock('@content-forge/publishers', () => {
      const mockPublish = vi.fn();
      const MockPublisher = vi.fn(() => ({ publish: mockPublish }));
      return {
        MediumPublisher: MockPublisher,
        LinkedInPublisher: MockPublisher,
        XThreadPublisher: MockPublisher,
        BasePublisher: class {},
      };
    });

    const mod = await import('../cli.js');
    promptApproval = mod.promptApproval;
  });

  it('should return true for "y" input', async () => {
    const mockRl = mockCreateInterface.mock.results[0]?.value
      ?? mockCreateInterface();
    mockRl.question.mockResolvedValueOnce('y');
    // Re-get after mock setup
    mockCreateInterface.mockReturnValue(mockRl);

    const result = await promptApproval(['medium', 'linkedin'] as Channel[]);
    expect(result).toBe(true);
  });

  it('should return true for "Y" input', async () => {
    const mockRl = { question: vi.fn().mockResolvedValueOnce('Y'), close: vi.fn() };
    mockCreateInterface.mockReturnValue(mockRl);

    const result = await promptApproval(['medium'] as Channel[]);
    expect(result).toBe(true);
  });

  it('should return false for "n" input', async () => {
    const mockRl = { question: vi.fn().mockResolvedValueOnce('n'), close: vi.fn() };
    mockCreateInterface.mockReturnValue(mockRl);

    const result = await promptApproval(['medium'] as Channel[]);
    expect(result).toBe(false);
  });

  it('should return false for empty input', async () => {
    const mockRl = { question: vi.fn().mockResolvedValueOnce(''), close: vi.fn() };
    mockCreateInterface.mockReturnValue(mockRl);

    const result = await promptApproval(['medium'] as Channel[]);
    expect(result).toBe(false);
  });
});

describe('publishContents', () => {
  let publishContents: typeof import('../cli.js').publishContents;

  beforeEach(async () => {
    vi.resetModules();

    vi.doMock('node:readline/promises', () => ({
      createInterface: vi.fn(() => ({
        question: vi.fn(),
        close: vi.fn(),
      })),
    }));
  });

  it('should publish to all channels on success', async () => {
    const mockPublish = vi.fn().mockResolvedValue({
      ok: true,
      value: {
        channel: 'medium',
        externalUrl: 'https://medium.com/@user/test-123',
        externalId: 'test-123',
        publishedAt: new Date(),
      },
    });

    vi.doMock('@content-forge/publishers', () => {
      const MockPublisher = vi.fn(() => ({ publish: mockPublish }));
      return {
        MediumPublisher: MockPublisher,
        LinkedInPublisher: MockPublisher,
        XThreadPublisher: MockPublisher,
        BasePublisher: class {},
      };
    });

    const mod = await import('../cli.js');
    publishContents = mod.publishContents;

    const contents: ChannelContent[] = [
      { channel: 'medium', title: 'Test', body: 'Body', metadata: {} },
      { channel: 'linkedin', title: 'Test', body: 'Body', metadata: {} },
    ];

    const result = await publishContents(contents);
    expect(result.successes).toHaveLength(2);
    expect(result.failures).toHaveLength(0);
    expect(mockPublish).toHaveBeenCalledTimes(2);
  });

  it('should handle partial failures', async () => {
    let callCount = 0;
    const mockPublish = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          value: {
            channel: 'medium',
            externalUrl: 'https://medium.com/@user/test-123',
            externalId: 'test-123',
            publishedAt: new Date(),
          },
        };
      }
      return {
        ok: false,
        error: { publisher: 'linkedin', message: 'Rate limit exceeded', retryable: true },
      };
    });

    vi.doMock('@content-forge/publishers', () => {
      const MockPublisher = vi.fn(() => ({ publish: mockPublish }));
      return {
        MediumPublisher: MockPublisher,
        LinkedInPublisher: MockPublisher,
        XThreadPublisher: MockPublisher,
        BasePublisher: class {},
      };
    });

    const mod = await import('../cli.js');
    publishContents = mod.publishContents;

    const contents: ChannelContent[] = [
      { channel: 'medium', title: 'Test', body: 'Body', metadata: {} },
      { channel: 'linkedin', title: 'Test', body: 'Body', metadata: {} },
    ];

    const result = await publishContents(contents);
    expect(result.successes).toHaveLength(1);
    expect(result.successes[0]).toBe('medium');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]!.channel).toBe('linkedin');
    expect(result.failures[0]!.error).toBe('Rate limit exceeded');
  });

  it('should skip channels without a publisher', async () => {
    vi.doMock('@content-forge/publishers', () => {
      const MockPublisher = vi.fn(() => ({
        publish: vi.fn().mockResolvedValue({
          ok: true,
          value: {
            channel: 'medium',
            externalUrl: 'https://medium.com/@user/test',
            externalId: 'test',
            publishedAt: new Date(),
          },
        }),
      }));
      return {
        MediumPublisher: MockPublisher,
        LinkedInPublisher: MockPublisher,
        XThreadPublisher: MockPublisher,
        BasePublisher: class {},
      };
    });

    const mod = await import('../cli.js');
    publishContents = mod.publishContents;

    const contents: ChannelContent[] = [
      { channel: 'youtube' as Channel, title: 'Test', body: 'Body', metadata: {} },
    ];

    const result = await publishContents(contents);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]!.error).toBe('No publisher available');
  });
});
