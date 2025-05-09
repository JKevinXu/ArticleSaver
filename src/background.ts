import { MessageType, Article } from './types';
import { generateId, formatDate, saveArticle, getSavedArticles, deleteArticle } from './utils';

// Create context menu items with better icon and title
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-highlight',
    title: 'Save "%s" to Article Saver',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-highlight' && info.selectionText && tab?.url && tab?.title) {
    // Create new article with the highlighted text
    const newArticle: Article = {
      id: generateId(),
      title: tab.title,
      url: tab.url,
      date: formatDate(new Date()),
      highlight: info.selectionText
    };
    
    // Save the article
    saveArticle(newArticle)
      .then(() => {
        // Send a notification to the user
        chrome.tabs.sendMessage(tab.id as number, {
          type: MessageType.SHOW_FEEDBACK,
          success: true,
          message: 'Highlight saved!'
        });
      })
      .catch(error => {
        console.error('Error saving highlight:', error);
        chrome.tabs.sendMessage(tab.id as number, {
          type: MessageType.SHOW_FEEDBACK,
          success: false,
          message: 'Error saving highlight'
        });
      });
  }
});

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