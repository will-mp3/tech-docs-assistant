// @ts-ignore - pdf-parse doesn't have great TypeScript support
import pdf from 'pdf-parse';

export interface ProcessedDocument {
  title: string;
  content: string;
  chunks: string[];
  metadata: {
    pageCount?: number;
    fileSize: number;
    fileType: string;
    originalName: string;
  };
}

export class FileProcessor {
  // Process PDF files
  static async processPDF(buffer: Buffer, originalName: string): Promise<ProcessedDocument> {
    try {
      console.log(`Processing PDF: ${originalName}`);
      
      const data = await pdf(buffer);
      const content = data.text;
      
      if (!content || content.trim().length === 0) {
        throw new Error('PDF appears to be empty or contains only images');
      }

      // Clean up the extracted text
      const cleanContent = this.cleanExtractedText(content);
      
      // Split into intelligent chunks
      const chunks = this.chunkText(cleanContent);
      
      console.log(`PDF processed: ${chunks.length} chunks from ${data.numpages} pages`);
      
      return {
        title: originalName.replace(/\.pdf$/i, ''),
        content: cleanContent,
        chunks,
        metadata: {
          pageCount: data.numpages,
          fileSize: buffer.length,
          fileType: 'pdf',
          originalName
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`PDF processing failed for ${originalName}:`, error);
      throw new Error(`Failed to process PDF: ${errorMessage}`);
    }
  }

  // Process plain text files
  static async processText(buffer: Buffer, originalName: string): Promise<ProcessedDocument> {
    try {
      console.log(`Processing text file: ${originalName}`);
      
      const content = buffer.toString('utf-8');
      
      if (!content || content.trim().length === 0) {
        throw new Error('Text file is empty');
      }

      const cleanContent = this.cleanExtractedText(content);
      const chunks = this.chunkText(cleanContent);
      
      console.log(`Text file processed: ${chunks.length} chunks`);
      
      return {
        title: originalName.replace(/\.(txt|md)$/i, ''),
        content: cleanContent,
        chunks,
        metadata: {
          fileSize: buffer.length,
          fileType: this.getFileType(originalName),
          originalName
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Text processing failed for ${originalName}:`, error);
      throw new Error(`Failed to process text file: ${errorMessage}`);
    }
  }

  // Clean up extracted text
  private static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers (common patterns)
      .replace(/Page \d+/gi, '')
      .replace(/^\d+\s*$/gm, '')
      // Clean up line breaks
      .replace(/\n\s*\n/g, '\n\n')
      // Trim
      .trim();
  }

  // Intelligent text chunking
  private static chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    
    // First, try to split by paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size
      if (currentChunk.length + paragraph.length > maxChunkSize) {
        // Save current chunk if it has content
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If paragraph itself is too long, split it further
        if (paragraph.length > maxChunkSize) {
          const sentences = paragraph.split('. ').filter(s => s.trim().length > 0);
          
          for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxChunkSize) {
              if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
              }
            }
            currentChunk += sentence + '. ';
          }
        } else {
          currentChunk = paragraph;
        }
      } else {
        currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    // Ensure we have at least one chunk
    if (chunks.length === 0) {
      chunks.push(text.substring(0, maxChunkSize));
    }
    
    return chunks;
  }

  // Determine file type from extension
  private static getFileType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'txt': return 'text';
      case 'md': return 'markdown';
      default: return 'unknown';
    }
  }

  // Main processing entry point
  static async processFile(buffer: Buffer, originalName: string): Promise<ProcessedDocument> {
    const fileType = this.getFileType(originalName);
    
    switch (fileType) {
      case 'pdf':
        return this.processPDF(buffer, originalName);
      case 'text':
      case 'markdown':
        return this.processText(buffer, originalName);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}