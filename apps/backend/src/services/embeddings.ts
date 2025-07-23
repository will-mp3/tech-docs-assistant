import { pipeline, env } from '@xenova/transformers';

// Configure transformers to run in Node.js environment
env.allowLocalModels = false;
env.allowRemoteModels = true;

let embeddingPipeline: any = null;
let initializationAttempted = false;

export class EmbeddingService {
  // Initialize the embedding model (runs once on startup)
  static async initialize(): Promise<void> {
    if (initializationAttempted) {
      throw new Error('Embedding service initialization already attempted');
    }
    
    initializationAttempted = true;
    console.log('Loading embedding model...');
    
    try {
      // Use a lightweight, fast sentence embedding model
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { 
          quantized: false,
          progress_callback: (progress: any) => {
            if (progress.status === 'downloading') {
              console.log(`Downloading model: ${Math.round(progress.progress || 0)}%`);
            }
          }
        }
      );
      console.log('Embedding model loaded successfully');
    } catch (error) {
      console.error('Failed to load embedding model:', error);
      embeddingPipeline = null;
      throw new Error(`Embedding model initialization failed: ${(error as Error).message}`);
    }
  }

  // Check if service is ready - ADD THIS METHOD
  static isInitialized(): boolean {
    return embeddingPipeline !== null;
  }

  // Generate embedding vector for text
  static async generateEmbedding(text: string): Promise<number[]> {
    if (!embeddingPipeline) {
      throw new Error('Embedding model not initialized. Check server startup logs.');
    }

    try {
      // Clean and prepare text
      const cleanText = text.trim().toLowerCase();
      if (!cleanText) {
        throw new Error('Empty text provided');
      }

      // Generate embedding
      const result = await embeddingPipeline(cleanText, {
        pooling: 'mean',
        normalize: true
      });

      // Extract the embedding vector with proper type casting
      const embedding = Array.from(result.data as Float32Array).map(x => Number(x));
      console.log(`Generated embedding for text: "${text.substring(0, 50)}..." (${embedding.length} dimensions)`);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Batch generate embeddings for multiple texts
  static async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }

  // Calculate cosine similarity between two embeddings
  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}