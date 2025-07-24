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
  technology: string;
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
  content: string;
  source: string;
  technology: string;
  timestamp: string;
}

export interface DocumentsResponse {
  documents: Document[];
  count: number;
}

export interface TestResponse {
  message: string;
  timestamp: string;
}

export interface NewDocument {
  title: string;
  content: string;
  source: string;
  technology: string;
}

export interface Source {
  title: string;
  source: string;
  relevance: number;
}

export interface RAGResponse {
  question: string;
  answer: string;
  reasoning: string;
  sources: Source[];
  totalSources: number;
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

  // Add new document
  addDocument: async (document: NewDocument): Promise<{ message: string; document: Document }> => {
    const response = await api.post<{ message: string; document: Document }>('/documents', document);
    return response.data;
  },

  // NEW: Ask AI question with RAG
  askQuestion: async (question: string): Promise<RAGResponse> => {
    const response = await api.post<RAGResponse>('/ask', { question });
    return response.data;
  }
};