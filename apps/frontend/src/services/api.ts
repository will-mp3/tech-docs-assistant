import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
}

export interface Document {
  id: string;
  title: string;
  technology: string;
}

export interface DocumentsResponse {
  documents: Document[];
  count: number;
}

export interface TestResponse {
  message: string;
  timestamp: string;
}

export const apiService = {
  // Test API connection
  test: async (): Promise<TestResponse> => {
    const response = await api.get<TestResponse>('/test');
    return response.data;
  },

  // Search documents
  search: async (query: string): Promise<SearchResponse> => {
    const response = await api.post<SearchResponse>('/search', { query });
    return response.data;
  },

  // Get all documents
  getDocuments: async (): Promise<DocumentsResponse> => {
    const response = await api.get<DocumentsResponse>('/documents');
    return response.data;
  },
};