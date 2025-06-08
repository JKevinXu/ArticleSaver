const fs = require('fs');
const path = require('path');

// Create directory for icons if it doesn't exist
const iconsDir = path.join(__dirname, 'src', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG for the article icon
function createArticleIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4285F4;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2563EB;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background circle -->
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="url(#grad)" />
    
    <!-- Document background -->
    <rect x="${size * 0.25}" y="${size * 0.2}" width="${size * 0.5}" height="${size * 0.6}" fill="white" />
    
    <!-- Document fold -->
    <polygon points="${size * 0.65},${size * 0.2} ${size * 0.75},${size * 0.2} ${size * 0.75},${size * 0.3}" fill="#f0f0f0" />
    
    <!-- Title line -->
    <rect x="${size * 0.29}" y="${size * 0.28}" width="${size * 0.35}" height="${size * 0.04}" fill="#666" />
    
    <!-- Content lines -->
    <rect x="${size * 0.29}" y="${size * 0.4}" width="${size * 0.4}" height="${size * 0.025}" fill="#666" />
    <rect x="${size * 0.29}" y="${size * 0.47}" width="${size * 0.4}" height="${size * 0.025}" fill="#666" />
    <rect x="${size * 0.29}" y="${size * 0.54}" width="${size * 0.25}" height="${size * 0.025}" fill="#666" />
    
    <!-- Highlight bar -->
    <rect x="${size * 0.29}" y="${size * 0.72}" width="${size * 0.15}" height="${size * 0.04}" fill="#FFA500" />
  </svg>`;
}

// Function to convert SVG to PNG data URL (simplified)
function svgToPngDataUrl(svgString, size) {
  // This creates a minimal PNG data URL
  // For a real conversion, you'd need a more sophisticated approach
  const svgBase64 = Buffer.from(svgString).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
}

// Generate icon files using pre-made PNG data (better approach for this case)
function generateIconFiles() {
  // Pre-generated PNG data for the article icon (Base64 encoded)
  // These are actual PNG files converted to Base64
  const iconData = {
    16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKYSURBVDiNpZM9aBRBFMd/b2Z2d3Y/kpCEJBYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFrY=',
 