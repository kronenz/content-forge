/**
 * Template invariant checker (minimal scaffold)
 */
import { existsSync } from 'node:fs';

const required = [
  'packages/core/src/index.ts',
  'packages/agents/src/index.ts',
  'packages/pipelines/src/index.ts',
  'docs/spec/architecture.md',
  'AGENTS.md'
];

const missing = required.filter(p => !existsSync(p));
if (missing.length > 0) {
  console.error('Missing required files:');
  for (const p of missing) console.error(` - ${p}`);
  process.exit(1);
}

console.log('Template invariants passed.');
