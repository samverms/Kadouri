const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/app/(dashboard)/accounts/page-with-sort-filter.tsx',
  'apps/web/src/app/(dashboard)/accounts/page.tsx',
  'apps/web/src/app/(dashboard)/accounts/page.tsx.backup.bak',
  'apps/web/src/app/(dashboard)/contracts/[id]/edit/page.tsx',
  'apps/web/src/app/(dashboard)/contracts/new/page.tsx',
  'apps/web/src/app/(dashboard)/contracts/page.tsx',
  'apps/web/src/app/(dashboard)/orders/new/page.tsx',
  'apps/web/src/app/(dashboard)/settings/page.tsx',
];

let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace ALL occurrences - single quotes, double quotes, backticks, anywhere
    content = content.replace(/http:\/\/localhost:2000/g, "${process.env.NEXT_PUBLIC_API_URL || ''}");

    // Fix the window.location.href case - it shouldn't be a template string
    content = content.replace(/window\.location\.href = "\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ''\}\/api\/quickbooks\/connect"/g,
      "window.location.href = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/quickbooks/connect'");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const count = (originalContent.match(/http:\/\/localhost:2000/g) || []).length;
      totalReplacements += count;
      console.log(`✓ Updated ${file} (${count} replacements)`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✓ Total: ${totalReplacements} replacements`);
