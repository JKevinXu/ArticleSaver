// Define the message types locally since they aren't all in the enum anymore
const MessageTypes = {
  SAVE_ARTICLE: 'SAVE_ARTICLE',
  SHOW_FEEDBACK: 'SHOW_FEEDBACK',
  SAVE_HIGHLIGHT: 'SAVE_HIGHLIGHT' // Keep this for backward compatibility
};

// Create floating button element
const floatingButton = document.createElement('button');
floatingButton.textContent = 'Save Highlight';
floatingButton.style.position = 'absolute';
floatingButton.style.zIndex = '10000';
floatingButton.style.backgroundColor = '#4285f4';
floatingButton.style.color = 'white';
floatingButton.style.padding = '8px 12px';
floatingButton.style.borderRadius = '4px';
floatingButton.style.border = 'none';
floatingButton.style.fontFamily = 'Arial, sans-serif';
floatingButton.style.fontSize = '14px';
floatingButton.style.cursor = 'pointer';
floatingButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
floatingButton.style.display = 'none';

// Add to the document
document.body.appendChild(floatingButton);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Support legacy message type for backward compatibility
  if (message.type === MessageTypes.SAVE_HIGHLIGHT) {
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
  
  // Handle feedback messages from the background script
  if (message.type === MessageTypes.SHOW_FEEDBACK) {
    showFeedback(message.message, !message.success);
    return true;
  }
});

// Track selected text
document.addEventListener('mouseup', (event) => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim() !== '') {
    // Text is selected, show the floating button
    const range = selection.getRangeAt(0).getBoundingClientRect();
    positionFloatingButton(range, event);
  } else {
    // Hide button when no text is selected
    floatingButton.style.display = 'none';
  }
});

// Hide button on scroll (prevents button from floating in wrong position)
document.addEventListener('scroll', () => {
  floatingButton.style.display = 'none';
});

// Position the floating button near the selected text
function positionFloatingButton(range: DOMRect, event: MouseEvent) {
  const buttonHeight = 36; // Approximate height of the button
  const topOffset = 10; // Space between selection and button
  
  // Position at mouse cursor for better UX
  const x = event.pageX;
  const y = event.pageY - buttonHeight - topOffset;
  
  floatingButton.style.left = `${x}px`;
  floatingButton.style.top = `${y}px`;
  floatingButton.style.display = 'block';
}

// Handle click on the floating button
floatingButton.addEventListener('click', () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim() !== '') {
    const highlight = selection.toString().trim();
    
    // Get the title and URL of the current page
    const currentUrl = window.location.href;
    const currentTitle = document.title;
    
    // Send message to background script to save the article with highlight
    chrome.runtime.sendMessage(
      {
        type: MessageTypes.SAVE_ARTICLE,
        payload: {
          title: currentTitle,
          url: currentUrl,
          highlight: highlight
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showFeedback('Error saving highlight', true);
          return;
        }
        
        if (response && response.success) {
          showFeedback('Highlight saved!', false);
          // Hide the button after successful save
          floatingButton.style.display = 'none';
        } else {
          showFeedback('Error saving highlight', true);
        }
      }
    );
  }
});

// Show feedback toast
function showFeedback(message: string, isError: boolean) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '4px';
  toast.style.backgroundColor = isError ? '#d93025' : '#4caf50';
  toast.style.color = 'white';
  toast.style.fontFamily = 'Arial, sans-serif';
  toast.style.zIndex = '10001';
  toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  document.body.appendChild(toast);
  
  // Remove the toast after 3 seconds
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
} 