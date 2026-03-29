// fix-encoding.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeBOM(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += scanDirectory(filePath);
    } else if (file.endsWith('.js')) {
      if (removeBOM(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

console.log('🔧 Starting BOM removal from all JS files...\n');

const srcDir = path.join(__dirname, 'src');
const fixedCount = scanDirectory(srcDir);

console.log(`\n✨ Done! Fixed ${fixedCount} file(s).`);
console.log('Now run: npm run dev');