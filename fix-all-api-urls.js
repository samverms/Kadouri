const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files containing localhost:2000
const grepOutput = execSync('git grep -l "localhost:2000" apps/web/src', { encoding: 'utf8' });
const files = grepOutput.trim().split('\n').filter(f => f);

console.log(`Found ${files.length} files with localhost:2000\n`);

let totalReplacements = 0;
let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace single-quoted strings
    content = content.replace(/'http:\/\/localhost:2000'/g, "process.env.NEXT_PUBLIC_API_URL || ''");

    // Replace double-quoted strings
    content = content.replace(/"http:\/\/localhost:2000"/g, "process.env.NEXT_PUBLIC_API_URL || ''");

    // Replace template literals (backticks)
    content = content.replace(/`http:\/\/localhost:2000`/g, "process.env.NEXT_PUBLIC_API_URL || ''");

    // Replace within template literals - e.g., `${...}http://localhost:2000/api/...`
    // This is trickier - we need to handle backtick strings that contain localhost:2000
    const backtickRegex = /`([^`]*http:\/\/localhost:2000[^`]*)`/g;
    content = content.replace(backtickRegex, (match, innerContent) => {
      const replaced = innerContent.replace(/http:\/\/localhost:2000/g, '${process.env.NEXT_PUBLIC_API_URL || \'\'}');
      return `\`${replaced}\``;
    });

    // Also handle concatenation patterns like (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000')
    content = content.replace(/\(process\.env\.NEXT_PUBLIC_API_URL \|\| ['"]http:\/\/localhost:2000['"]\)/g, "(process.env.NEXT_PUBLIC_API_URL || '')");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const count = (originalContent.match(/localhost:2000/g) || []).length;
      totalReplacements += count;
      filesModified++;
      console.log(`✓ Updated ${file} (${count} replacements)`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✓ Total: ${totalReplacements} replacements across ${filesModified} files`);
