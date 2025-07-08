import { MessageType, Article, GitHubConfig } from './types';
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
  
  if (message.type === MessageType.IMPORT_ARTICLES) {
    const articles = message.payload as Article[];
    
    // Get current articles from storage
    getSavedArticles()
      .then(async (existingArticles) => {
        try {
          // Create a map of existing URLs to avoid duplicates
          const existingUrls = new Map(existingArticles.map(a => [a.url, a]));
          
          // Merge imported articles with existing ones, preferring existing for duplicates
          const mergedArticles = [...existingArticles];
          
          // Add new articles that don't exist yet
          for (const article of articles) {
            if (!existingUrls.has(article.url)) {
              mergedArticles.push(article);
            }
          }
          
          // Sort articles by date (newest first)
          // This uses a helper function to parse the formatted date strings
          mergedArticles.sort((a, b) => {
            const dateA = parseDateString(a.date);
            const dateB = parseDateString(b.date);
            return dateB.getTime() - dateA.getTime();
          });
          
          // Save the sorted merged articles
          await chrome.storage.local.set({ articles: mergedArticles });
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error importing articles:', error);
          sendResponse({ success: false, error });
        }
      })
      .catch((error) => {
        console.error('Error importing articles:', error);
        sendResponse({ success: false, error });
      });
    
    return true; // Will respond asynchronously
  }
  
  if (message.type === MessageType.SAVE_GITHUB_CONFIG) {
    const config = message.payload as GitHubConfig;
    
    chrome.storage.local.set({ githubConfig: config })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error saving GitHub config:', error);
        sendResponse({ success: false, error });
      });
    
    return true; // Will respond asynchronously
  }
  
  if (message.type === MessageType.GET_GITHUB_CONFIG) {
    chrome.storage.local.get(['githubConfig'])
      .then((result) => {
        sendResponse({
          type: MessageType.GET_GITHUB_CONFIG_RESPONSE,
          payload: result.githubConfig || null
        });
      })
      .catch((error) => {
        console.error('Error getting GitHub config:', error);
        sendResponse({
          type: MessageType.GET_GITHUB_CONFIG_RESPONSE,
          payload: null
        });
      });
    
    return true; // Will respond asynchronously
  }
  
  if (message.type === MessageType.SYNC_TO_GITHUB) {
    const { articles, config } = message.payload;
    
    syncToGitHub(articles, config)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error syncing to GitHub:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Unknown error occurred' 
        });
      });
    
    return true; // Will respond asynchronously
  }
});

/**
 * Parse a date string in the format used by the extension
 * This handles dates in the format: "MMM D, YYYY, h:mm AM/PM"
 */
function parseDateString(dateStr: string): Date {
  try {
    return new Date(dateStr);
  } catch (e) {
    // If parsing fails, return current date as fallback
    console.error('Failed to parse date:', dateStr);
    return new Date();
  }
}

/**
 * Sync articles to GitHub repository
 */
async function syncToGitHub(articles: Article[], config: GitHubConfig): Promise<void> {
  try {
    // Transform articles to match the expected format for readings.json
    const readingsData = articles.map(article => ({
      title: article.title,
      url: article.url,
      date: article.date,
      ...(article.highlight && { highlight: article.highlight }),
      ...(article.highlights && { highlights: article.highlights })
    }));
    
    // Get the current file content to get the SHA
    const getCurrentFileResponse = await fetch(
      `https://api.github.com/repos/${config.repo}/contents/${config.path}`,
      {
        headers: {
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    );
    
    let sha: string | undefined;
    if (getCurrentFileResponse.ok) {
      const fileData = await getCurrentFileResponse.json();
      sha = fileData.sha;
    }
    
    // Create the file content
    const content = JSON.stringify(readingsData, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    // Update the file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${config.repo}/contents/${config.path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update readings.json with ${articles.length} articles`,
          content: encodedContent,
          ...(sha && { sha })
        })
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub API error: ${errorData.message || 'Unknown error'}`);
    }
    
    console.log('Successfully synced articles to GitHub');
  } catch (error) {
    console.error('Error syncing to GitHub:', error);
    throw error;
  }
} 