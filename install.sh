#!/bin/bash

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if the install was successful
if [ $? -eq 0 ]; then
    echo "Dependencies installed successfully!"
    
    # Build the extension
    echo "Building the extension..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "Build completed successfully!"
        echo ""
        echo "---- NEXT STEPS ----"
        echo "1. Add your OpenAI API key to src/background.ts"
        echo "2. Run 'npm run build' to rebuild with your API key"
        echo "3. Load the extension in Chrome:"
        echo "   - Go to chrome://extensions/"
        echo "   - Enable Developer mode"
        echo "   - Click 'Load unpacked' and select the 'dist' directory"
        echo ""
        echo "For development with auto-rebuild, run: npm run watch"
    else
        echo "Build failed. Please check for errors."
    fi
else
    echo "Failed to install dependencies. Please check for errors."
fi 