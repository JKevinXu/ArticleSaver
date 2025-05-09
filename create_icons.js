const fs = require('fs');
const path = require('path');

// Create directory for icons if it doesn't exist
const iconsDir = path.join(__dirname, 'src', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple function to create a colored square as a PNG (Data URL)
function createSimpleIconDataURL(size, color) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Add letter 'A' in the center
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size / 2);
  
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
}

// We can't use the above in Node.js environment directly, so let's use a simpler approach
// This is a pre-generated minimal valid PNG icon (1x1 transparent pixel)
const minimalValidPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// Write the icon files
fs.writeFileSync(path.join(iconsDir, 'icon16.png'), minimalValidPNG);
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), minimalValidPNG);
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), minimalValidPNG);

console.log('Icons created successfully!'); 