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
  // Shared helper functions
  generateExcerpt(content: string, searchQuery: string, maxLength: number = 300): string {
    if (!content) return '';
    
    const cleanContent = content.replace(/<[^>]*>/g, '');
    
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }

    const queryWords = searchQuery.toLowerCase().split(/\s+/);
    const contentLower = cleanContent.toLowerCase();
    
    let bestPosition = 0;
    let maxMatches = 0;
    
    for (let i = 0; i < cleanContent.length - maxLength; i += 50) {
      const section = contentLower.substring(i, i + maxLength);
      const matches = queryWords.filter(word => section.includes(word)).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestPosition = i;
      }
    }

    let excerpt = cleanContent.substring(bestPosition, bestPosition + maxLength);
    
    const lastPeriod = excerpt.lastIndexOf('.');
    if (lastPeriod > maxLength * 0.7) {
      excerpt = excerpt.substring(0, lastPeriod + 1);
    }

    const prefix = bestPosition > 0 ? '...' : '';
    const suffix = bestPosition + excerpt.length < content.length ? '...' : '';
    
    return prefix + excerpt.trim() + suffix;
  },

  formatSource(sourceData: any): string {
    if (!sourceData) return 'Unknown source';
    
    const source = sourceData.source || 'Unknown source';
    const metadata = sourceData.metadata;
    
    if (metadata?.url) {
      return metadata.url;
    }
    
    if (metadata?.originalName) {
      return `${source} (${metadata.originalName})`;
    }
    
    return source;
  },

  generateExcerptFromHighlights(highlights: any, fullContent: string, searchQuery: string): string {
    if (highlights?.content) {
      const highlightedText = highlights.content.join(' ... ');
      return highlightedText.replace(/<[^>]*>/g, '');
    }
    
    return this.generateExcerpt(fullContent || '', searchQuery);
  },

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
          _source: ['title', 'content', 'source', 'technology', 'embedding', 'metadata']
        }
      });

      // Step 2: Keyword search with highlighting
      const keywordResponse = await opensearchClient.search({
        index: 'documents',
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ['title^3', 'content^2', 'technology'],
              type: 'best_fields' as const,
              fuzziness: 'AUTO' as const
            }
          },
          highlight: {
            fields: {
              title: {},
              content: {
                fragment_size: 150,
                number_of_fragments: 2,
                pre_tags: ["<mark>"],
                post_tags: ["</mark>"]
              }
            }
          },
          size: size * 2
        }
      });

      // Step 3: Calculate vector similarities
      const vectorResults: Array<{ doc: SearchResult; similarity: number }> = [];
      
      for (const hit of allDocsResponse.body.hits.hits) {
        if (hit._source && hit._source.embedding) {
          const similarity = EmbeddingService.cosineSimilarity(
            queryEmbedding,
            hit._source.embedding
          );
          
          vectorResults.push({
            doc: {
              id: hit._id,
              title: hit._source.title || '',
              content: this.generateExcerpt(hit._source.content || '', query),
              source: this.formatSource(hit._source),
              technology: hit._source.technology || '',
              score: similarity
            },
            similarity
          });
        }
      }

      // Step 4: Sort vector results by similarity
      vectorResults.sort((a, b) => b.similarity - a.similarity);

      // Step 5: Process keyword results with excerpts
      const keywordResults = keywordResponse.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source?.title || '',
        content: this.generateExcerptFromHighlights(hit.highlight, hit._source?.content, query),
        source: this.formatSource(hit._source),
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
          // Use highlighted excerpt if available
          if (result.content.includes('<mark>')) {
            existing.content = result.content;
          }
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

  // Enhanced search with filters
  async searchDocumentsWithFilters(
    query: string, 
    filters: {
      technology: string[],
      fileType: string[],
      dateRange: string,
      sortBy: string
    },
    size: number = 10
  ): Promise<SearchResult[]> {
    try {
      // Build date range filter
      const getDateRangeFilter = (dateRange: string) => {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            return null;
        }
        
        return {
          range: {
            timestamp: {
              gte: startDate.toISOString()
            }
          }
        };
      };

      // Build file type filter based on metadata
      const getFileTypeFilter = (fileTypes: string[]) => {
        if (fileTypes.length === 0) return null;
        
        const fileTypeMapping: { [key: string]: string[] } = {
          'pdf': ['pdf'],
          'word': ['word'],
          'text': ['text', 'markdown'],
          'webpage': ['webpage'],
          'manual': ['manual']
        };
        
        const mappedTypes: string[] = [];
        fileTypes.forEach(type => {
          if (fileTypeMapping[type.toLowerCase()]) {
            mappedTypes.push(...fileTypeMapping[type.toLowerCase()]);
          }
        });
        
        return mappedTypes.length > 0 ? {
          terms: {
            'metadata.fileType.keyword': mappedTypes
          }
        } : null;
      };

      // Build technology filter
      const getTechnologyFilter = (technologies: string[]) => {
        if (technologies.length === 0) return null;
        
        return {
          terms: {
            'technology.keyword': technologies
          }
        };
      };

      // Build the base query with filters
      const buildFilteredQuery = () => {
        const mustClauses = [];
        const filterClauses = [];
        
        // Main search query
        mustClauses.push({
          multi_match: {
            query: query,
            fields: ['title^3', 'content^2', 'technology'],
            type: 'best_fields' as const,
            fuzziness: 'AUTO' as const
          }
        });
        
        // Add filters
        const dateFilter = getDateRangeFilter(filters.dateRange);
        if (dateFilter) filterClauses.push(dateFilter);
        
        const fileTypeFilter = getFileTypeFilter(filters.fileType);
        if (fileTypeFilter) filterClauses.push(fileTypeFilter);
        
        const technologyFilter = getTechnologyFilter(filters.technology);
        if (technologyFilter) filterClauses.push(technologyFilter);
        
        if (filterClauses.length > 0) {
          return {
            bool: {
              must: mustClauses,
              filter: filterClauses
            }
          };
        } else {
          return {
            bool: {
              must: mustClauses
            }
          };
        }
      };

      // Build vector search query with filters
      const buildVectorSearchQuery = () => {
        const filterClauses = [];
        const dateFilter = getDateRangeFilter(filters.dateRange);
        if (dateFilter) filterClauses.push(dateFilter);
        
        const fileTypeFilter = getFileTypeFilter(filters.fileType);
        if (fileTypeFilter) filterClauses.push(fileTypeFilter);
        
        const technologyFilter = getTechnologyFilter(filters.technology);
        if (technologyFilter) filterClauses.push(technologyFilter);
        
        if (filterClauses.length > 0) {
          return {
            bool: {
              must: [{ match_all: {} }],
              filter: filterClauses
            }
          };
        } else {
          return { match_all: {} };
        }
      };

      // Generate embedding for vector search
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);
      
      // Step 1: Get all documents with embeddings for vector search (with filters)
      const vectorSearchQuery = buildVectorSearchQuery();

      const allDocsResponse = await opensearchClient.search({
        index: 'documents',
        body: {
          query: vectorSearchQuery,
          size: 100,
          _source: ['title', 'content', 'source', 'technology', 'embedding', 'metadata']
        }
      });

      // Step 2: Keyword search with filters and highlighting
      const keywordResponse = await opensearchClient.search({
        index: 'documents',
        body: {
          query: buildFilteredQuery(),
          highlight: {
            fields: {
              title: {},
              content: {
                fragment_size: 150,
                number_of_fragments: 2,
                pre_tags: ["<mark>"],
                post_tags: ["</mark>"]
              }
            }
          },
          size: size * 2
        }
      });

      // Step 3: Calculate vector similarities
      const vectorResults: Array<{ doc: SearchResult; similarity: number }> = [];
      
      for (const hit of allDocsResponse.body.hits.hits) {
        if (hit._source && hit._source.embedding) {
          const similarity = EmbeddingService.cosineSimilarity(
            queryEmbedding,
            hit._source.embedding
          );
          
          vectorResults.push({
            doc: {
              id: hit._id,
              title: hit._source.title || '',
              content: this.generateExcerpt(hit._source.content || '', query),
              source: this.formatSource(hit._source),
              technology: hit._source.technology || '',
              score: similarity
            },
            similarity
          });
        }
      }

      // Step 4: Sort vector results
      vectorResults.sort((a, b) => b.similarity - a.similarity);

      // Step 5: Process keyword results
      const keywordResults = keywordResponse.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source?.title || '',
        content: hit.highlight?.content ? 
          hit.highlight.content.join(' ... ').replace(/<[^>]*>/g, '') : 
          this.generateExcerpt(hit._source?.content || '', query),
        source: this.formatSource(hit._source),
        technology: hit._source?.technology || '',
        score: hit._score / 10
      }));

      // Step 6: Merge and deduplicate
      const combinedResults = new Map<string, SearchResult>();

      vectorResults.slice(0, size).forEach(({ doc }) => {
        combinedResults.set(doc.id, {
          ...doc,
          score: doc.score * 0.7
        });
      });

      keywordResults.forEach(result => {
        if (combinedResults.has(result.id)) {
          const existing = combinedResults.get(result.id)!;
          existing.score = Math.min(existing.score + (result.score * 0.3), 1);
          if (result.content.includes('...')) {
            existing.content = result.content;
          }
        } else {
          combinedResults.set(result.id, {
            ...result,
            score: result.score * 0.5
          });
        }
      });

      // Step 7: Sort results based on sortBy parameter
      let finalResults = Array.from(combinedResults.values());
      
      switch (filters.sortBy) {
        case 'date':
          finalResults.sort((a, b) => b.score - a.score);
          break;
        case 'title':
          finalResults.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'relevance':
        default:
          finalResults.sort((a, b) => b.score - a.score);
          break;
      }
      
      finalResults = finalResults.slice(0, size);

      console.log(`Filtered search for "${query}" with filters:`, filters);
      console.log(`Found ${finalResults.length} results`);
      console.log(`Vector candidates: ${vectorResults.length}, Keyword results: ${keywordResults.length}`);
      
      return finalResults;

    } catch (error) {
      console.error('Error in filtered search, falling back to regular search:', error);
      return this.searchDocuments(query, size);
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
              type: 'best_fields' as const,
              fuzziness: 'AUTO' as const
            }
          },
          _source: ['title', 'content', 'source', 'technology', 'metadata'],
          size: size
        }
      });

      const hits = response.body.hits.hits;
      return hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source?.title || '',
        content: this.generateExcerpt(hit._source?.content || '', query),
        source: this.formatSource(hit._source),
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