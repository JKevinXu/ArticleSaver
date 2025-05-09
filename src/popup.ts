import { MessageType, Article } from './types';

// DOM Elements
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const saveHighlightBtn = document.getElementById('saveHighlightBtn') as HTMLButtonElement;
const confirmHighlightBtn = document.getElementById('confirmHighlightBtn') as HTMLButtonElement;
const cancelHighlightBtn = document.getElementById('cancelHighlightBtn') as HTMLButtonElement;
const highlightContainer = document.getElementById('highlightContainer') as HTMLDivElement;
const highlightText = document.getElementById('highlightText') as HTMLDivElement;
const articleList = document.getElementById('articleList') as HTMLDivElement;

// Current state
let currentHighlight: string = '';

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Load saved articles
  loadSavedArticles();
  
  // Set up event listeners
  saveBtn.addEventListener('click', handleSaveCurrentPage);
  saveHighlightBtn.addEventListener('click', handleSaveHighlight);
  confirmHighlightBtn.addEventListener('click', handleConfirmHighlight);
  cancelHighlightBtn.addEventListener('click', handleCancelHighlight);
});

/**
 * Handle saving the current page
 */
async function handleSaveCurrentPage() {
  try {
    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const currentTab = tabs[0];
        const articleData = {
          title: currentTab.title || 'Untitled Page',
          url: currentTab.url || '',
        };
        
        // Send message to background script to save the article
        chrome.runtime.sendMessage(
          {
            type: MessageType.SAVE_ARTICLE,
            payload: articleData
          },
          (response) => {
            if (chrome.runtime.lastError) {
              showError('Failed to save article');
              return;
            }
            
            if (response && response.success) {
              showNotification('Article saved successfully');
              loadSavedArticles(); // Refresh the list
            } else {
              showError('Failed to save article');
            }
          }
        );
      }
    });
  } catch (error) {
    showError('An error occurred while saving');
    console.error(error);
  }
}

/**
 * Handle initiating the text highlight saving process
 */
function handleSaveHighlight() {
  try {
    chrome.runtime.sendMessage(
      { type: MessageType.SAVE_HIGHLIGHT },
      (response) => {
        if (chrome.runtime.lastError) {
          showError('Failed to communicate with the page');
          return;
        }
        
        if (response && response.success) {
          currentHighlight = response.highlight;
          highlightText.textContent = currentHighlight;
          highlightContainer.classList.remove('hidden');
        } else {
          showError(response?.error || 'No text is highlighted');
        }
      }
    );
  } catch (error) {
    showError('An error occurred while getting highlighted text');
    console.error(error);
  }
}

/**
 * Handle confirming and saving the highlighted text
 */
function handleConfirmHighlight() {
  if (!currentHighlight) {
    showError('No text is highlighted');
    return;
  }
  
  try {
    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const currentTab = tabs[0];
        const articleData = {
          title: currentTab.title || 'Untitled Page',
          url: currentTab.url || '',
          highlight: currentHighlight
        };
        
        // Send message to background script to save the article with highlight
        chrome.runtime.sendMessage(
          {
            type: MessageType.SAVE_ARTICLE,
            payload: articleData
          },
          (response) => {
            if (chrome.runtime.lastError) {
              showError('Failed to save highlight');
              return;
            }
            
            if (response && response.success) {
              showNotification('Highlight saved successfully');
              highlightContainer.classList.add('hidden');
              currentHighlight = '';
              loadSavedArticles(); // Refresh the list
            } else {
              showError('Failed to save highlight');
            }
          }
        );
      }
    });
  } catch (error) {
    showError('An error occurred while saving highlight');
    console.error(error);
  }
}

/**
 * Handle canceling the highlight saving process
 */
function handleCancelHighlight() {
  highlightContainer.classList.add('hidden');
  currentHighlight = '';
}

/**
 * Load and display saved articles
 */
function loadSavedArticles() {
  chrome.runtime.sendMessage(
    { type: MessageType.GET_ARTICLES },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      
      if (response && response.type === MessageType.GET_ARTICLES_RESPONSE) {
        displayArticles(response.payload);
      }
    }
  );
}

/**
 * Delete an article
 */
function deleteArticle(id: string) {
  chrome.runtime.sendMessage(
    {
      type: MessageType.DELETE_ARTICLE,
      payload: id
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showError('Failed to delete article');
        return;
      }
      
      if (response && response.success) {
        loadSavedArticles(); // Refresh the list
      } else {
        showError('Failed to delete article');
      }
    }
  );
}

/**
 * Display the list of saved articles
 */
function displayArticles(articles: Article[]) {
  // Clear the list
  articleList.innerHTML = '';
  
  if (!articles || articles.length === 0) {
    articleList.innerHTML = '<p class="empty-message">No saved articles yet</p>';
    return;
  }
  
  // Create a list item for each article
  articles.forEach((article) => {
    const articleItem = document.createElement('div');
    articleItem.className = 'article-item';
    
    const articleTitle = document.createElement('div');
    articleTitle.className = 'article-title';
    articleTitle.textContent = article.title;
    
    const articleUrl = document.createElement('div');
    articleUrl.className = 'article-url';
    articleUrl.textContent = article.url;
    
    const articleDate = document.createElement('div');
    articleDate.className = 'article-date';
    articleDate.textContent = article.date;
    
    articleItem.appendChild(articleTitle);
    articleItem.appendChild(articleUrl);
    articleItem.appendChild(articleDate);
    
    // If there's a highlight, display it
    if (article.highlight) {
      const highlight = document.createElement('div');
      highlight.className = 'article-highlight';
      highlight.textContent = `"${article.highlight}"`;
      articleItem.appendChild(highlight);
    }
    
    const articleActions = document.createElement('div');
    articleActions.className = 'article-actions';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.innerHTML = '&times;';
    deleteButton.title = 'Delete article';
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent opening the article when clicking delete
      deleteArticle(article.id);
    });
    
    articleActions.appendChild(deleteButton);
    articleItem.appendChild(articleActions);
    
    // When clicking on an article, open it in a new tab
    articleItem.addEventListener('click', () => {
      chrome.tabs.create({ url: article.url });
    });
    
    articleList.appendChild(articleItem);
  });
}

/**
 * Show error message
 */
function showError(message: string) {
  console.error(message);
  alert(`Error: ${message}`);
}

/**
 * Show notification
 */
function showNotification(message: string) {
  console.log(message);
  // In a real implementation, you'd show this as a toast
  // For now, we'll just use a simple alert
  alert(message);
} 