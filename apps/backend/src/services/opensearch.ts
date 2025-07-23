import { Client } from '@opensearch-project/opensearch';
import { EmbeddingService } from './embeddings';

// Create OpenSearch client
export const opensearchClient = new Client({
  node: 'http://localhost:9200'
});

// Document interface with embedding
export interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  technology: string;
  timestamp: string;
  embedding?: number[];
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
  // Create index with vector field support
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
                timestamp: { type: 'date' },
                embedding: {
                  type: 'knn_vector',
                  dimension: 384,
                  method: {
                    name: 'hnsw',
                    space_type: 'cosinesimil',
                    engine: 'lucene'
                  }
                }
              }
            }
          }
        });
        console.log('Created documents index with vector support');
      }
    } catch (error) {
      console.error('Error ensuring index:', error);
    }
  },

  // Index a document with embedding
  async indexDocument(document: Document): Promise<void> {
    try {
      let documentToIndex = { ...document };
      
      // Generate embedding if service is available
      try {
        if (EmbeddingService.isInitialized()) {
          const textToEmbed = `${document.title} ${document.content}`;
          const embedding = await EmbeddingService.generateEmbedding(textToEmbed);
          documentToIndex.embedding = embedding;
          console.log(`Indexed document with embedding: ${document.title}`);
        } else {
          console.log(`Indexed document without embedding: ${document.title}`);
        }
      } catch (embeddingError) {
        const errorMsg = embeddingError instanceof Error ? embeddingError.message : 'Unknown error';
        console.warn(`Failed to generate embedding for "${document.title}": ${errorMsg}`);
      }

      await opensearchClient.index({
        index: 'documents',
        id: document.id,
        body: documentToIndex
      });
      
    } catch (error) {
      console.error('Error indexing document:', error);
      throw error;
    }
  },

  // Manual hybrid search: combines keyword and vector search
  async searchDocuments(query: string, size: number = 10): Promise<SearchResult[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);
      
      // Step 1: Get all documents with embeddings for vector search
      const allDocsResponse = await opensearchClient.search({
        index: 'documents',
        body: {
          query: { match_all: {} },
          size: 100,
          _source: ['title', 'content', 'source', 'technology', 'embedding']
        }
      });

      // Step 2: Keyword search
      const keywordResponse = await opensearchClient.search({
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
          size: size * 2
        }
      });

      // Step 3: Calculate vector similarities
      const vectorResults: Array<{ doc: SearchResult; similarity: number }> = [];
      
      for (const hit of allDocsResponse.body.hits.hits) {
        // Type-safe access to _source
        if (hit._source && hit._source.embedding) {
          const similarity = EmbeddingService.cosineSimilarity(
            queryEmbedding,
            hit._source.embedding
          );
          
          vectorResults.push({
            doc: {
              id: hit._id,
              title: hit._source.title || '',
              content: hit._source.content || '',
              source: hit._source.source || '',
              technology: hit._source.technology || '',
              score: similarity
            },
            similarity
          });
        }
      }

      // Step 4: Sort vector results by similarity
      vectorResults.sort((a, b) => b.similarity - a.similarity);

      // Step 5: Process keyword results
      const keywordResults = keywordResponse.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source?.title || '',
        content: hit._source?.content || '',
        source: hit._source?.source || '',
        technology: hit._source?.technology || '',
        score: hit._score / 10
      }));

      // Step 6: Merge and deduplicate results
      const combinedResults = new Map<string, SearchResult>();

      // Add vector results
      vectorResults.slice(0, size).forEach(({ doc }) => {
        combinedResults.set(doc.id, {
          ...doc,
          score: doc.score * 0.7
        });
      });

      // Add keyword results
      keywordResults.forEach(result => {
        if (combinedResults.has(result.id)) {
          const existing = combinedResults.get(result.id)!;
          existing.score = Math.min(existing.score + (result.score * 0.3), 1);
        } else {
          combinedResults.set(result.id, {
            ...result,
            score: result.score * 0.5
          });
        }
      });

      // Step 7: Sort and return results
      const finalResults = Array.from(combinedResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, size);

      console.log(`Hybrid search for "${query}" found ${finalResults.length} results`);
      console.log(`Vector candidates: ${vectorResults.length}, Keyword results: ${keywordResults.length}`);
      
      return finalResults;

    } catch (error) {
      console.error('Error in hybrid search, falling back to keyword search:', error);
      return this.keywordSearchOnly(query, size);
    }
  },

  // Fallback keyword search
  async keywordSearchOnly(query: string, size: number = 10): Promise<SearchResult[]> {
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
          size: size
        }
      });

      const hits = response.body.hits.hits;
      return hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source?.title || '',
        content: hit._source?.content || '',
        source: hit._source?.source || '',
        technology: hit._source?.technology || '',
        score: Math.min(hit._score / 10, 1)
      }));
    } catch (error) {
      console.error('Error in keyword search:', error);
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
        title: hit._source?.title || '',
        content: hit._source?.content || '',
        source: hit._source?.source || '',
        technology: hit._source?.technology || '',
        timestamp: hit._source?.timestamp || '',
        embedding: hit._source?.embedding
      }));
    } catch (error) {
      console.error('Error getting all documents:', error);
      return [];
    }
  }
};