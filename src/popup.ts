import { MessageType, Article, GitHubConfig } from './types';

// DOM Elements
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const articleList = document.getElementById('articleList') as HTMLDivElement;
const exportBtn = document.getElementById('exportBtn') as HTMLAnchorElement;
const importBtn = document.getElementById('importBtn') as HTMLAnchorElement;
const syncBtn = document.getElementById('syncBtn') as HTMLAnchorElement;
const configBtn = document.getElementById('configBtn') as HTMLAnchorElement;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;

// Modal elements
const configModal = document.getElementById('configModal') as HTMLDivElement;
const closeModal = document.getElementById('closeModal') as HTMLSpanElement;
const githubTokenInput = document.getElementById('githubToken') as HTMLInputElement;
const githubRepoInput = document.getElementById('githubRepo') as HTMLInputElement;
const githubPathInput = document.getElementById('githubPath') as HTMLInputElement;
const saveConfigBtn = document.getElementById('saveConfigBtn') as HTMLButtonElement;
const cancelConfigBtn = document.getElementById('cancelConfigBtn') as HTMLButtonElement;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Load saved articles
  loadSavedArticles();
  
  // Set up event listeners
  saveBtn.addEventListener('click', handleSaveCurrentPage);
  
  // Export/Import functionality
  exportBtn?.addEventListener('click', handleExportArticles);
  importBtn?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', handleImportArticles);
  
  // GitHub sync functionality
  syncBtn?.addEventListener('click', handleSyncToGitHub);
  configBtn?.addEventListener('click', openConfigModal);
  
  // Modal functionality
  closeModal?.addEventListener('click', closeConfigModal);
  cancelConfigBtn?.addEventListener('click', closeConfigModal);
  saveConfigBtn?.addEventListener('click', handleSaveConfig);
  
  // Close modal when clicking outside
  configModal?.addEventListener('click', (e) => {
    if (e.target === configModal) {
      closeConfigModal();
    }
  });
  
  // Load GitHub configuration
  loadGitHubConfig();
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
function handleExportArticles(e: MouseEvent) {
  e.preventDefault();
  
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
 * Import articles from a JSON file
 */
function handleImportArticles(event: Event) {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.[0];
  
  if (!file) {
    showError('No file selected');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const articles = JSON.parse(content) as Article[];
      
      // Validate the imported data
      if (!Array.isArray(articles)) {
        showError('Invalid format: Import file must contain an array of articles');
        return;
      }
      
      // Validate that each article has required fields
      const validArticles = articles.filter(article => 
        article && typeof article === 'object' && 
        article.id && article.title && article.url && article.date);
      
      if (validArticles.length === 0) {
        showError('No valid articles found in import file');
        return;
      }
      
      // Import the articles
      importArticles(validArticles);
    } catch (error) {
      showError('Failed to parse import file');
      console.error(error);
    }
    
    // Reset the file input
    fileInput.value = '';
  };
  
  reader.onerror = () => {
    showError('Failed to read import file');
    // Reset the file input
    fileInput.value = '';
  };
  
  reader.readAsText(file);
}

/**
 * Import articles to storage
 */
function importArticles(articles: Article[]) {
  chrome.runtime.sendMessage(
    {
      type: MessageType.IMPORT_ARTICLES,
      payload: articles
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showError('Failed to import articles');
        return;
      }
      
      if (response && response.success) {
        showNotification(`Successfully imported ${articles.length} articles`);
        loadSavedArticles(); // Refresh the list
      } else {
        showError('Failed to import articles');
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

/**
 * Open the GitHub configuration modal
 */
function openConfigModal() {
  if (configModal) {
    configModal.style.display = 'flex';
  }
}

/**
 * Close the GitHub configuration modal
 */
function closeConfigModal() {
  if (configModal) {
    configModal.style.display = 'none';
  }
}

/**
 * Load GitHub configuration from storage
 */
function loadGitHubConfig() {
  chrome.runtime.sendMessage(
    { type: MessageType.GET_GITHUB_CONFIG },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to load GitHub config:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.type === MessageType.GET_GITHUB_CONFIG_RESPONSE) {
        const config = response.payload as GitHubConfig;
        if (config) {
          githubTokenInput.value = config.token || '';
          githubRepoInput.value = config.repo || 'JKevinXu/github-blog';
          githubPathInput.value = config.path || '_data/readings.json';
        }
      }
    }
  );
}

/**
 * Save GitHub configuration
 */
function handleSaveConfig() {
  const config: GitHubConfig = {
    token: githubTokenInput.value.trim(),
    repo: githubRepoInput.value.trim(),
    path: githubPathInput.value.trim()
  };
  
  if (!config.token || !config.repo || !config.path) {
    showError('Please fill in all fields');
    return;
  }
  
  chrome.runtime.sendMessage(
    {
      type: MessageType.SAVE_GITHUB_CONFIG,
      payload: config
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showError('Failed to save configuration');
        return;
      }
      
      if (response && response.success) {
        showNotification('Configuration saved successfully');
        closeConfigModal();
      } else {
        showError('Failed to save configuration');
      }
    }
  );
}

/**
 * Handle syncing articles to GitHub
 */
function handleSyncToGitHub() {
  // First, get the current articles
  chrome.runtime.sendMessage(
    { type: MessageType.GET_ARTICLES },
    (response) => {
      if (chrome.runtime.lastError) {
        showError('Failed to get articles for sync');
        return;
      }
      
      if (response && response.type === MessageType.GET_ARTICLES_RESPONSE) {
        const articles = response.payload as Article[];
        
        if (!articles || articles.length === 0) {
          showError('No articles to sync');
          return;
        }
        
        // Get GitHub configuration
        chrome.runtime.sendMessage(
          { type: MessageType.GET_GITHUB_CONFIG },
          (configResponse) => {
            if (chrome.runtime.lastError) {
              showError('Failed to get GitHub configuration');
              return;
            }
            
            if (configResponse && configResponse.type === MessageType.GET_GITHUB_CONFIG_RESPONSE) {
              const config = configResponse.payload as GitHubConfig;
              
              if (!config || !config.token || !config.repo || !config.path) {
                showError('GitHub configuration not found. Please configure GitHub settings first.');
                return;
              }
              
              // Show loading state
              showSyncStatus('Syncing to GitHub...', 'loading');
              
              // Perform the sync
              chrome.runtime.sendMessage(
                {
                  type: MessageType.SYNC_TO_GITHUB,
                  payload: { articles, config }
                },
                (syncResponse) => {
                  if (chrome.runtime.lastError) {
                    showSyncStatus('Sync failed: ' + chrome.runtime.lastError.message, 'error');
                    return;
                  }
                  
                  if (syncResponse && syncResponse.success) {
                    showSyncStatus('Successfully synced to GitHub!', 'success');
                  } else {
                    showSyncStatus('Sync failed: ' + (syncResponse?.error || 'Unknown error'), 'error');
                  }
                }
              );
            } else {
              showError('GitHub configuration not found. Please configure GitHub settings first.');
            }
          }
        );
      }
    }
  );
}

/**
 * Show sync status message
 */
function showSyncStatus(message: string, type: 'success' | 'error' | 'loading') {
  // Remove any existing status
  const existingStatus = document.querySelector('.sync-status');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  // Create new status element
  const statusEl = document.createElement('div');
  statusEl.className = `sync-status ${type}`;
  statusEl.textContent = message;
  
  // Add to container
  const container = document.querySelector('.container');
  if (container) {
    container.appendChild(statusEl);
    
    // Auto-remove after 5 seconds for success/error messages
    if (type !== 'loading') {
      setTimeout(() => {
        statusEl.remove();
      }, 5000);
    }
  }
} 