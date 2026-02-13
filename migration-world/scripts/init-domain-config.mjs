import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const templatePath = resolve('config/domain.template.json');
const domainPath = resolve('config/domain.json');

if (!existsSync(templatePath)) {
  console.error('Missing template:', templatePath);
  process.exit(1);
}

if (existsSync(domainPath)) {
  console.log('config/domain.json already exists. No changes made.');
  process.exit(0);
}

copyFileSync(templatePath, domainPath);
console.log('Created config/domain.json from template.');
console.log('Next: update project/domain/objective, entityNames, adapters, governance.');
