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
 */
export const saveArticle = async (article: Article): Promise<void> => {
  const { articles = [] } = await chrome.storage.local.get('articles') as { articles: Article[] };
  const updatedArticles = [article, ...articles];
  
  await chrome.storage.local.set({ articles: updatedArticles });
};

/**
 * Get all saved articles from Chrome storage
 */
export const getSavedArticles = async (): Promise<Article[]> => {
  const { articles = [] } = await chrome.storage.local.get('articles') as { articles: Article[] };
  return articles;
};

/**
 * Delete an article from Chrome storage
 */
export const deleteArticle = async (id: string): Promise<void> => {
  const { articles = [] } = await chrome.storage.local.get('articles') as { articles: Article[] };
  const updatedArticles = articles.filter((article: Article) => article.id !== id);
  
  await chrome.storage.local.set({ articles: updatedArticles });
}; 