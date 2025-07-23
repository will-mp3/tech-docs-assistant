import { Client } from '@opensearch-project/opensearch';

// Create OpenSearch client
export const opensearchClient = new Client({
  node: 'http://localhost:9200'
});

// Document interface
export interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  technology: string;
  timestamp: string;
}

// Search result interface
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  technology: string;
  score: number;
}

// OpenSearch operations
export const opensearchService = {
  // Create index if it doesn't exist
  async ensureIndex(): Promise<void> {
    try {
      const indexExists = await opensearchClient.indices.exists({
        index: 'documents'
      });

      if (!indexExists.body) {
        await opensearchClient.indices.create({
          index: 'documents',
          body: {
            mappings: {
              properties: {
                title: { 
                  type: 'text', 
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                content: { 
                  type: 'text', 
                  analyzer: 'standard' 
                },
                source: { type: 'keyword' },
                technology: { type: 'keyword' },
                timestamp: { type: 'date' }
              }
            }
          }
        });
        console.log('Created documents index');
      }
    } catch (error) {
      console.error('Error ensuring index:', error);
    }
  },

  // Index a document
  async indexDocument(document: Document): Promise<void> {
    try {
      await opensearchClient.index({
        index: 'documents',
        id: document.id,
        body: document
      });
      console.log(`Indexed document: ${document.title}`);
    } catch (error) {
      console.error('Error indexing document:', error);
      throw error;
    }
  },

  // Search documents
  async searchDocuments(query: string, size: number = 10): Promise<SearchResult[]> {
    try {
      const response = await opensearchClient.search({
        index: 'documents',
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ['title^3', 'content^2', 'technology'],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          },
          highlight: {
            fields: {
              title: {},
              content: {}
            }
          },
          size: size
        }
      });

      const hits = response.body.hits.hits;
      return hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source.title,
        content: hit._source.content,
        source: hit._source.source,
        technology: hit._source.technology,
        score: hit._score / 10 // Normalize score to 0-1 range
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  },

  // Get all documents
  async getAllDocuments(): Promise<Document[]> {
    try {
      const response = await opensearchClient.search({
        index: 'documents',
        body: {
          query: { match_all: {} },
          size: 1000
        }
      });

      const hits = response.body.hits.hits;
      return hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source
      }));
    } catch (error) {
      console.error('Error getting all documents:', error);
      return [];
    }
  }
};