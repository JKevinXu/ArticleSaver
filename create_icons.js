const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directory for icons if it doesn't exist
const iconsDir = path.join(__dirname, 'src', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function createArticleIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background circle
  ctx.fillStyle = '#4285F4';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Document shape
  const docWidth = size * 0.5;
  const docHeight = size * 0.6;
  const docX = (size - docWidth) / 2;
  const docY = (size - docHeight) / 2;
  
  // Document background
  ctx.fillStyle = 'white';
  ctx.fillRect(docX, docY, docWidth, docHeight);
  
  // Document lines (representing text)
  ctx.fillStyle = '#666';
  const lineHeight = size * 0.06;
  const lineMargin = size * 0.08;
  
  for (let i = 0; i < 4; i++) {
    const lineY = docY + lineMargin + (i * lineHeight * 1.5);
    const lineWidth = i === 3 ? docWidth * 0.6 : docWidth * 0.8;
    ctx.fillRect(docX + lineMargin, lineY, lineWidth - lineMargin * 2, lineHeight * 0.5);
  }
  
  return canvas.toBuffer('image/png');
}

// Generate icons for different sizes
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const iconBuffer = createArticleIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), iconBuffer);
});

console.log('Article Summarizer icons created successfully!'); 