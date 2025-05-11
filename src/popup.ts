import { MessageType, Article } from './types';

// DOM Elements
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const articleList = document.getElementById('articleList') as HTMLDivElement;
const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Load saved articles
  loadSavedArticles();
  
  // Set up event listeners
  saveBtn.addEventListener('click', handleSaveCurrentPage);
  exportBtn?.addEventListener('click', handleExportArticles);
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
    
    // Display highlights section
    if (article.highlights && article.highlights.length > 0) {
      // Display multiple highlights
      const highlightsContainer = document.createElement('div');
      highlightsContainer.className = 'highlights-container';
      
      if (article.highlights.length > 1) {
        const highlightCount = document.createElement('div');
        highlightCount.className = 'highlight-count';
        highlightCount.textContent = `${article.highlights.length} Highlights`;
        highlightsContainer.appendChild(highlightCount);
      }
      
      article.highlights.forEach(highlight => {
        const highlightEl = document.createElement('div');
        highlightEl.className = 'article-highlight';
        highlightEl.textContent = `"${highlight}"`;
        highlightsContainer.appendChild(highlightEl);
      });
      
      articleItem.appendChild(highlightsContainer);
    } else if (article.highlight) {
      // For backward compatibility - display single highlight
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

/**
 * Export all saved articles as a JSON file
 */
function handleExportArticles() {
  chrome.runtime.sendMessage(
    { type: MessageType.GET_ARTICLES },
    (response) => {
      if (chrome.runtime.lastError) {
        showError('Failed to export articles');
        return;
      }
      
      if (response && response.type === MessageType.GET_ARTICLES_RESPONSE) {
        const articles = response.payload;
        if (!articles || articles.length === 0) {
          showNotification('No articles to export');
          return;
        }
        
        // Create a JSON string with proper formatting
        const articlesJson = JSON.stringify(articles, null, 2);
        
        // Create a blob with the JSON data
        const blob = new Blob([articlesJson], { type: 'application/json' });
        
        // Create a temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `article-summarizer-export-${formatDateForFilename(new Date())}.json`;
        
        // Trigger the download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
        
        showNotification('Articles exported successfully');
      }
    }
  );
}

/**
 * Format date for use in filenames (YYYY-MM-DD_HH-MM-SS)
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
} 