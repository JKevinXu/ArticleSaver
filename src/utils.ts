/// <reference types="chrome"/>
import { Article } from './types';

/**
 * Generate a random ID for an article
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Format a date as a string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
};

/**
 * Extract the main text content from a webpage
 * This is a simple implementation - could be improved with more sophisticated parsing
 */
export const extractArticleContent = (): string => {
  // Try to find the main content
  const article = document.querySelector('article');
  if (article) {
    return article.textContent || '';
  }

  // Look for common content containers
  const contentSelectors = [
    'main',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '#content'
  ];
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.length > 500) {
      return element.textContent;
    }
  }

  // Fallback: collect all paragraphs
  const paragraphs = Array.from(document.querySelectorAll('p'));
  // Filter out short paragraphs that might be UI elements
  const contentParagraphs = paragraphs.filter(p => 
    p.textContent && 
    p.textContent.length > 100 && 
    !p.querySelector('button')
  );
  
  return contentParagraphs.map(p => p.textContent).join('\n\n');
};

/**
 * Store an article in Chrome storage
 * If an article with the same URL already exists, add the highlight to it
 */
export const saveArticle = async (article: Article): Promise<void> => {
  const { articles = [] } = await chrome.storage.local.get('articles') as { articles: Article[] };
  
  // Check if an article with the same URL already exists
  const existingArticleIndex = articles.findIndex(a => a.url === article.url);
  
  if (existingArticleIndex !== -1 && article.highlight) {
    // Article exists and we have a highlight to add
    const existingArticle = articles[existingArticleIndex];
    
    // Convert existing highlights to an array if it's a string
    let highlights: string[] = [];
    if (existingArticle.highlights) {
      highlights = [...existingArticle.highlights];
    } else if (existingArticle.highlight) {
      highlights = [existingArticle.highlight];
    }
    
    // Add the new highlight if it doesn't already exist
    if (article.highlight && !highlights.includes(article.highlight)) {
      highlights.push(article.highlight);
    }
    
    // Update the existing article with the new highlights
    articles[existingArticleIndex] = {
      ...existingArticle,
      highlights: highlights,
      // Update the date to show it was recently modified
      date: formatDate(new Date())
    };
    
    // Sort articles by date (newest first)
    articles.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    await chrome.storage.local.set({ articles: articles });
  } else {
    // Article doesn't exist or no highlight to add
    let newArticle = {...article};
    
    // Convert single highlight to highlights array if exists
    if (article.highlight) {
      newArticle.highlights = [article.highlight];
    }
    
    const updatedArticles = [newArticle, ...articles.filter(a => a.url !== article.url)];
    
    // Sort articles by date (newest first)
    updatedArticles.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    await chrome.storage.local.set({ articles: updatedArticles });
  }
};

/**
 * Get all saved articles from Chrome storage
 */
export const getSavedArticles = async (): Promise<Article[]> => {
  const { articles = [] } = await chrome.storage.local.get('articles') as { articles: Article[] };
  
  // Sort articles by date (newest first)
  return articles.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
};

/**
 * Delete an article from Chrome storage
 */
export const deleteArticle = async (id: string): Promise<void> => {
  const { articles = [] } = await chrome.storage.local.get('articles') as { articles: Article[] };
  const updatedArticles = articles.filter((article: Article) => article.id !== id);
  
  await chrome.storage.local.set({ articles: updatedArticles });
}; 