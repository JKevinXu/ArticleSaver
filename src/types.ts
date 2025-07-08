export interface Article {
  id: string;
  title: string;
  url: string;
  date: string;
  highlight?: string;
  highlights?: string[];
}

export enum MessageType {
  SAVE_ARTICLE = 'SAVE_ARTICLE',
  GET_ARTICLES = 'GET_ARTICLES',
  GET_ARTICLES_RESPONSE = 'GET_ARTICLES_RESPONSE',
  DELETE_ARTICLE = 'DELETE_ARTICLE',
  SHOW_FEEDBACK = 'SHOW_FEEDBACK',
  IMPORT_ARTICLES = 'IMPORT_ARTICLES',
  SYNC_TO_GITHUB = 'SYNC_TO_GITHUB',
  SAVE_GITHUB_CONFIG = 'SAVE_GITHUB_CONFIG',
  GET_GITHUB_CONFIG = 'GET_GITHUB_CONFIG',
  GET_GITHUB_CONFIG_RESPONSE = 'GET_GITHUB_CONFIG_RESPONSE'
}

export interface Message {
  type: MessageType;
  payload?: any;
}

export interface SummarizeRequest {
  url: string;
  title: string;
  content: string;
}

export interface SummarizeResponse {
  summary: string;
  error?: string;
}

export interface GitHubConfig {
  token: string;
  repo: string;
  path: string;
}

export interface SyncToGitHubRequest {
  articles: Article[];
  config: GitHubConfig;
} 