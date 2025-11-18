const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/app/accept-invitation/page.tsx',
  'apps/web/src/app/(dashboard)/orders/page.tsx',
  'apps/web/src/app/(dashboard)/orders/new/page.tsx',
  'apps/web/src/app/(dashboard)/orders/[id]/page.tsx',
  'apps/web/src/app/(dashboard)/products/page.tsx',
  'apps/web/src/app/(dashboard)/products/new/page.tsx',
  'apps/web/src/app/(dashboard)/products/[id]/page.tsx',
  'apps/web/src/app/(dashboard)/products/[id]/edit/page.tsx',
  'apps/web/src/app/(dashboard)/invoices/page.tsx',
  'apps/web/src/app/(dashboard)/settings/page.tsx',
  'apps/web/src/app/(dashboard)/accounts/page.tsx',
  'apps/web/src/app/(dashboard)/contracts/page.tsx',
  'apps/web/src/components/accounts/create-account-modal.tsx',
  'apps/web/src/app/(dashboard)/contracts/[id]/edit/page.tsx',
  'apps/web/src/app/(dashboard)/contracts/new/page.tsx',
  'apps/web/src/app/(dashboard)/contracts/[id]/page.tsx',
  'apps/web/src/app/(dashboard)/accounts/page-with-sort-filter.tsx',
  'apps/web/src/app/(dashboard)/accounts/[id]/page.tsx',
  'apps/web/src/app/(dashboard)/accounts/new/page.tsx',
  'apps/web/src/app/(dashboard)/settings/roles/page.tsx',
];

let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace all occurrences of 'http://localhost:2000' with environment variable
    content = content.replace(/['"]http:\/\/localhost:2000['"]/g, "process.env.NEXT_PUBLIC_API_URL || ''");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const count = (originalContent.match(/['"]http:\/\/localhost:2000['"]/g) || []).length;
      totalReplacements += count;
      console.log(`✓ Updated ${file} (${count} replacements)`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✓ Total: ${totalReplacements} replacements across ${files.length} files`);
