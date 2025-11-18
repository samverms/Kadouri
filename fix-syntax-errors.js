const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files containing the broken pattern
const files = [
  'apps/web/src/app/(dashboard)/accounts/page-with-sort-filter.tsx',
  'apps/web/src/app/(dashboard)/accounts/page.tsx',
  'apps/web/src/app/(dashboard)/accounts/page.tsx.backup.bak',
  'apps/web/src/app/(dashboard)/contracts/[id]/edit/page.tsx',
  'apps/web/src/app/(dashboard)/contracts/new/page.tsx',
  'apps/web/src/app/(dashboard)/contracts/page.tsx',
  'apps/web/src/app/(dashboard)/orders/new/page.tsx',
  'apps/web/src/app/(dashboard)/orders/page.tsx',
  'apps/web/src/app/(dashboard)/settings/page.tsx',
];

let totalFixes = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix single-quoted strings with template literal syntax
    content = content.replace(/'(\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ''\}[^']*)'/g, '`$1`');

    // Fix double-quoted strings with template literal syntax
    content = content.replace(/"(\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ''\}[^"]*)"/g, '`$1`');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const count = (originalContent.match(/['"]\$\{process\.env\.NEXT_PUBLIC_API_URL/g) || []).length;
      totalFixes += count;
      console.log(`✓ Fixed ${file} (${count} fixes)`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✓ Total: ${totalFixes} syntax errors fixed`);
