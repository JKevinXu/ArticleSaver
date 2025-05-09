import { MessageType } from './types';

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.SAVE_HIGHLIGHT) {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== '') {
      sendResponse({
        success: true,
        highlight: selection.toString().trim()
      });
    } else {
      sendResponse({
        success: false,
        error: 'No text is highlighted'
      });
    }
    return true; // Keep the message channel open for the response
  }
});

// Add context menu when text is selected
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim() !== '') {
    // Text is selected, we could add a custom UI here if needed
    // For now, we'll rely on the extension popup
  }
}); 