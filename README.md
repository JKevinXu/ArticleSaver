# Article Saver Chrome Extension

A Chrome extension built with TypeScript that allows you to save articles for later reading.

## Features

- Save current webpage articles for later reference
- One-click saving of current page
- View a list of saved articles
- Delete articles you no longer need
- Open saved articles in new tabs

## Tech Stack

- TypeScript
- Chrome Extension API
- Local Storage for saving articles

## Setup Instructions

1. Clone this repository:
   ```
   git clone <repository-url>
   cd article-saver
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" by toggling the switch in the top right
   - Click "Load unpacked" and select the `dist` directory from this project

## Development

To start development with hot-reloading:

```
npm run watch
```

## Usage

1. Navigate to any article you want to save
2. Click the extension icon in the Chrome toolbar
3. Click "Save Current Page" to add it to your list
4. Click on a saved article to open it in a new tab
5. Click the "×" button to delete an article

## Privacy & Data Storage

- Articles are stored locally in Chrome's storage
- No data is sent to any external servers
- No API keys are required

## License

MIT 