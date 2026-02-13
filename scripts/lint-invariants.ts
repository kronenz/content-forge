/**
 * Mechanical invariant checker for ContentForge.
 * Run: npx tsx scripts/lint-invariants.ts
 *
 * These rules are enforced mechanically, not by documentation.
 * If this script fails, CI fails.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const PACKAGES_DIR = join(process.cwd(), 'packages');
const ERRORS: string[] = [];
const WARNINGS: string[] = [];

function walkDir(dir: string, ext: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    if (statSync(full).isDirectory()) {
      files.push(...walkDir(full, ext));
    } else if (extname(full) === ext) {
      files.push(full);
    }
  }
  return files;
}

function getSourceFiles(): string[] {
  return walkDir(PACKAGES_DIR, '.ts').filter(
    f => !f.includes('__tests__') && !f.includes('.test.') && !f.includes('.spec.') && !f.includes('/dist/')
  );
}

function getTestFiles(): string[] {
  return walkDir(PACKAGES_DIR, '.ts').filter(
    f => (f.includes('__tests__') || f.includes('.test.') || f.includes('.spec.')) && !f.includes('/dist/')
  );
}

// Rule 1: No console.log in source files
function checkNoConsoleLog(): void {
  for (const file of getSourceFiles()) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
        // Allow in CLI entry point and logger implementation
        if (file.includes('cli.ts') || file.includes('logger.ts')) continue;
        ERRORS.push(`${relative(process.cwd(), file)}:${i + 1} - console.log found. Use createLogger() instead.`);
      }
    }
  }
}

// Rule 2: ESM imports must use .js extension
function checkEsmExtensions(): void {
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  for (const file of getSourceFiles()) {
    const content = readFileSync(file, 'utf-8');
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]!;
      // Skip @content-forge/* imports (handled by package resolution)
      if (importPath.startsWith('@')) continue;
      // Relative imports must end with .js
      if (importPath.startsWith('.') && !importPath.endsWith('.js') && !importPath.endsWith('.json')) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        ERRORS.push(`${relative(process.cwd(), file)}:${lineNum} - Import "${importPath}" missing .js extension`);
      }
    }
  }
}

// Rule 3: No hardcoded secrets
function checkNoSecrets(): void {
  const secretPatterns = [
    /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /sk-[a-zA-Z0-9]{20,}/,
    /Bearer\s+[a-zA-Z0-9._-]{20,}(?!['"]?\s*\$\{)/,
  ];
  for (const file of getSourceFiles()) {
    // Skip test files and type definition files
    if (file.includes('.d.ts')) continue;
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      for (const pattern of secretPatterns) {
        if (pattern.test(line)) {
          // Allow template literals with env vars
          if (line.includes('process.env') || line.includes('${')) continue;
          // Allow type definitions and mock data
          if (line.includes('interface') || line.includes('type ') || line.includes('mock') || line.includes('Mock')) continue;
          // Allow config.apiKey references
          if (line.includes('config.apiKey') || line.includes('this.config')) continue;
          WARNINGS.push(`${relative(process.cwd(), file)}:${i + 1} - Possible hardcoded secret: ${line.trim().substring(0, 60)}...`);
        }
      }
    }
  }
}

// Rule 4: No cross-package imports (except from core)
function checkDependencyDirection(): void {
  const crossImportRegex = /from\s+['"]@content-forge\/(?!core)([^'"]+)['"]/g;
  for (const file of getSourceFiles()) {
    // CLI can import from any package
    if (file.includes('packages/cli/')) continue;
    const content = readFileSync(file, 'utf-8');
    const filePkg = file.split('packages/')[1]?.split('/')[0];
    let match: RegExpExecArray | null;
    while ((match = crossImportRegex.exec(content)) !== null) {
      const importedPkg = match[1]!.split('/')[0];
      if (importedPkg !== filePkg) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        WARNINGS.push(
          `${relative(process.cwd(), file)}:${lineNum} - Cross-package import @content-forge/${importedPkg} from ${filePkg}. Only @content-forge/core is allowed.`
        );
      }
    }
  }
}

// Rule 5: No debugger statements
function checkNoDebugger(): void {
  for (const file of [...getSourceFiles(), ...getTestFiles()]) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (line === 'debugger' || line === 'debugger;') {
        ERRORS.push(`${relative(process.cwd(), file)}:${i + 1} - debugger statement found`);
      }
    }
  }
}

// Rule 6: No TODO/HACK/FIXME in committed code (warnings only)
function checkNoTodoHack(): void {
  for (const file of getSourceFiles()) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/\b(TODO|HACK|FIXME|XXX)\b/.test(line)) {
        WARNINGS.push(`${relative(process.cwd(), file)}:${i + 1} - ${line.trim().substring(0, 80)}`);
      }
    }
  }
}

// Run all checks
console.log('ContentForge Invariant Checker');
console.log('================================\n');

checkNoConsoleLog();
checkEsmExtensions();
checkNoSecrets();
checkDependencyDirection();
checkNoDebugger();
checkNoTodoHack();

if (WARNINGS.length > 0) {
  console.log(`\nWarnings (${WARNINGS.length}):`);
  for (const w of WARNINGS) {
    console.log(`  [WARN] ${w}`);
  }
}

if (ERRORS.length > 0) {
  console.log(`\nErrors (${ERRORS.length}):`);
  for (const e of ERRORS) {
    console.log(`  [ERROR] ${e}`);
  }
  console.log('\nInvariant check FAILED.');
  process.exit(1);
} else {
  console.log(`\nAll invariants passed. (${WARNINGS.length} warnings)`);
  process.exit(0);
}
