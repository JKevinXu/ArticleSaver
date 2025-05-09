export interface Article {
  id: string;
  title: string;
  url: string;
  date: string;
  highlight?: string;
}

export enum MessageType {
  SAVE_ARTICLE = 'SAVE_ARTICLE',
  GET_ARTICLES = 'GET_ARTICLES',
  GET_ARTICLES_RESPONSE = 'GET_ARTICLES_RESPONSE',
  DELETE_ARTICLE = 'DELETE_ARTICLE',
  SAVE_HIGHLIGHT = 'SAVE_HIGHLIGHT'
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