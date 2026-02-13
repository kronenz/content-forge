#!/usr/bin/env node
/**
 * ContentForge CLI - Transform content for multiple channels
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { type Channel, type Material, type RawContent, type ChannelContent } from '@content-forge/core';
import { TextPipeline } from '@content-forge/pipelines';
import {
  type BasePublisher,
  type PublisherConfig,
  MediumPublisher,
  LinkedInPublisher,
  XThreadPublisher
} from '@content-forge/publishers';

interface CliFlags {
  inputFile: string;
  outputDir: string;
  publish: boolean;
  yes: boolean;
  help: boolean;
}

export function parseFlags(argv: string[]): CliFlags {
  const flags: CliFlags = {
    inputFile: '',
    outputDir: './output',
    publish: false,
    yes: false,
    help: false,
  };

  const positional: string[] = [];

  for (const arg of argv) {
    switch (arg) {
      case '--publish':
        flags.publish = true;
        break;
      case '--yes':
        flags.yes = true;
        break;
      case '--help':
        flags.help = true;
        break;
      default:
        positional.push(arg);
    }
  }

  flags.inputFile = positional[0] ?? '';
  if (positional[1]) {
    flags.outputDir = positional[1];
  }

  return flags;
}

export async function promptApproval(channels: Channel[]): Promise<boolean> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      `\nPublish to ${channels.join(', ')}? (y/n): `
    );
    return answer.toLowerCase().trim() === 'y';
  } finally {
    rl.close();
  }
}

export function createPublishersForChannels(channels: Channel[]): Map<Channel, BasePublisher> {
  const map = new Map<Channel, BasePublisher>();
  const cfg = (ch: Channel, key?: string): PublisherConfig => {
    const base: PublisherConfig = {
      channel: ch,
      maxRetries: 3,
    };
    if (key !== undefined) {
      base.apiKey = key;
    }
    return base;
  };

  for (const ch of channels) {
    switch (ch) {
      case 'medium':
        map.set(ch, new MediumPublisher(cfg(ch, process.env.MEDIUM_API_KEY)));
        break;
      case 'linkedin':
        map.set(ch, new LinkedInPublisher(cfg(ch, process.env.LINKEDIN_API_KEY)));
        break;
      case 'x-thread':
        map.set(ch, new XThreadPublisher(cfg(ch, process.env.X_API_KEY)));
        break;
    }
  }
  return map;
}

export async function publishContents(
  contents: ChannelContent[]
): Promise<{ successes: string[]; failures: Array<{ channel: string; error: string }> }> {
  const channels = contents.map(c => c.channel);
  const publishers = createPublishersForChannels(channels);

  const successes: string[] = [];
  const failures: Array<{ channel: string; error: string }> = [];

  console.log(`\nPublishing to ${contents.length} channels...\n`);

  for (const content of contents) {
    const publisher = publishers.get(content.channel);
    if (!publisher) {
      failures.push({ channel: content.channel, error: 'No publisher available' });
      console.log(`  ${content.channel}: FAILED — No publisher available`);
      continue;
    }

    const result = await publisher.publish(content);
    if (result.ok) {
      successes.push(content.channel);
      console.log(`  ${content.channel}: Published → ${result.value.externalUrl}`);
    } else {
      failures.push({ channel: content.channel, error: result.error.message });
      console.log(`  ${content.channel}: FAILED — ${result.error.message}`);
    }
  }

  console.log('');
  if (failures.length === 0) {
    console.log(`${successes.length}/${contents.length} channels published successfully.`);
  } else {
    console.log(
      `${successes.length}/${contents.length} channels published. ${failures.length} failed.`
    );
  }

  return { successes, failures };
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.help || !flags.inputFile) {
    printUsage();
    process.exit(0);
  }

  const inputFile = flags.inputFile;

  // Read input markdown file
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputFile, 'utf-8');
  const title = path.basename(inputFile, path.extname(inputFile));

  // Create material from file
  const material: Material = {
    id: `cli-${Date.now()}`,
    source: 'cli',
    url: `file://${path.resolve(inputFile)}`,
    title,
    content,
    score: 10,
    tags: ['cli-input'],
    status: 'new',
    collectedAt: new Date(),
    createdAt: new Date(),
  };

  // Create raw content
  const rawContent: RawContent = {
    material,
    pipelineType: 'text',
    targetChannels: ['medium', 'linkedin', 'x-thread'],
  };

  // Run text pipeline
  const pipeline = new TextPipeline();
  const result = await pipeline.process(rawContent);

  if (!result.ok) {
    console.error(`Pipeline error: ${result.error.message}`);
    process.exit(1);
  }

  // Display results
  console.log('\n=== ContentForge Output ===\n');

  for (const channelContent of result.value) {
    console.log(`--- ${channelContent.channel.toUpperCase()} ---`);
    console.log(`Title: ${channelContent.title}`);
    console.log(`Length: ${channelContent.body.length} chars`);
    console.log('');
    console.log(channelContent.body);
    console.log('\n');
  }

  // Optional: write output files
  const outputDir = flags.outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const channelContent of result.value) {
    const outputFile = path.join(outputDir, `${channelContent.channel}.md`);
    fs.writeFileSync(outputFile, `# ${channelContent.title}\n\n${channelContent.body}`);
    console.log(`Written: ${outputFile}`);
  }

  // Publish flow
  if (flags.publish) {
    const channels = result.value.map(c => c.channel);
    const approved = flags.yes || await promptApproval(channels);

    if (approved) {
      await publishContents(result.value);
    } else {
      console.log('\nPublishing skipped.');
    }
  }
}

function printUsage(): void {
  console.log(`
ContentForge CLI - Transform content for multiple channels

Usage:
  content-forge <input.md> [output-dir] [--publish] [--yes]

Arguments:
  input.md    Markdown file to transform
  output-dir  Output directory (default: ./output)

Options:
  --publish   Proceed with publishing after transformation
  --yes       Auto-approve publishing (requires --publish)
  --help      Show this help message
`);
}

// Only run main if this is the entry point (not imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
