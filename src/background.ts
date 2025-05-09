import { MessageType, Article } from './types';
import { generateId, formatDate, saveArticle, getSavedArticles, deleteArticle } from './utils';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.SAVE_ARTICLE) {
    const articleData = message.payload;
    const newArticle: Article = {
      id: generateId(),
      title: articleData.title,
      url: articleData.url,
      date: formatDate(new Date()),
      highlight: articleData.highlight || ''
    };
    
    saveArticle(newArticle)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error saving article:', error);
        sendResponse({ success: false, error });
      });
    
    return true; // Will respond asynchronously
  }
  
  if (message.type === MessageType.SAVE_HIGHLIGHT) {
    // Get active tab to capture the highlight
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: MessageType.SAVE_HIGHLIGHT },
          (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({ 
                success: false, 
                error: 'Failed to communicate with the page' 
              });
              return;
            }
            
            if (response && response.success) {
              sendResponse({
                success: true,
                highlight: response.highlight
              });
            } else {
              sendResponse({
                success: false,
                error: response?.error || 'Unknown error'
              });
            }
          }
        );
      } else {
        sendResponse({ 
          success: false, 
          error: 'No active tab found' 
        });
      }
    });
    
    return true; // Will respond asynchronously
  }
  
  if (message.type === MessageType.GET_ARTICLES) {
    getSavedArticles()
      .then((articles) => {
        sendResponse({
          type: MessageType.GET_ARTICLES_RESPONSE,
          payload: articles
        });
      })
      .catch((error) => {
        console.error('Error getting articles:', error);
        sendResponse({
          type: MessageType.GET_ARTICLES_RESPONSE,
          payload: []
        });
      });
    
    return true; // Will respond asynchronously
  }
  
  if (message.type === MessageType.DELETE_ARTICLE) {
    const articleId = message.payload;
    
    deleteArticle(articleId)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error deleting article:', error);
        sendResponse({ success: false, error });
      });
    
    return true; // Will respond asynchronously
  }
}); 