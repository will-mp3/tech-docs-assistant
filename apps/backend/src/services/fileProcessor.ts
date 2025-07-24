// @ts-ignore - pdf-parse doesn't have great TypeScript support
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ProcessedDocument {
  title: string;
  content: string;
  chunks: string[];
  metadata: {
    pageCount?: number;
    fileSize: number;
    fileType: string;
    originalName: string;
    url?: string;
    wordCount?: number;
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

      const cleanContent = this.cleanExtractedText(content);
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
          originalName,
          wordCount: this.countWords(cleanContent)
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`PDF processing failed for ${originalName}:`, error);
      throw new Error(`Failed to process PDF: ${errorMessage}`);
    }
  }

  // Process Word documents
  static async processWord(buffer: Buffer, originalName: string): Promise<ProcessedDocument> {
    try {
      console.log(`Processing Word document: ${originalName}`);
      
      const result = await mammoth.extractRawText({ buffer });
      const content = result.value;
      
      if (!content || content.trim().length === 0) {
        throw new Error('Word document appears to be empty');
      }

      const cleanContent = this.cleanExtractedText(content);
      const chunks = this.chunkText(cleanContent);
      
      console.log(`Word document processed: ${chunks.length} chunks`);
      
      return {
        title: originalName.replace(/\.(docx|doc)$/i, ''),
        content: cleanContent,
        chunks,
        metadata: {
          fileSize: buffer.length,
          fileType: 'word',
          originalName,
          wordCount: this.countWords(cleanContent)
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Word processing failed for ${originalName}:`, error);
      throw new Error(`Failed to process Word document: ${errorMessage}`);
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
          originalName,
          wordCount: this.countWords(cleanContent)
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Text processing failed for ${originalName}:`, error);
      throw new Error(`Failed to process text file: ${errorMessage}`);
    }
  }

  // Process web pages from URL - FIXED VERSION
  static async processWebPage(url: string): Promise<ProcessedDocument> {
    try {
      console.log(`Processing web page: ${url}`);
      
      // Fetch the web page with proper typing
      const response = await axios.get<string>(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'TechDocsAssistant/1.0 (Documentation Indexer)'
        },
        responseType: 'text'
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse HTML content - FIXED
      const $ = cheerio.load(response.data);
      
      // Extract meaningful content
      const title = this.extractTitle($);
      const content = this.extractMainContent($);
      
      if (!content || content.trim().length === 0) {
        throw new Error('No meaningful content found on the web page');
      }

      const cleanContent = this.cleanExtractedText(content);
      const chunks = this.chunkText(cleanContent);
      
      console.log(`Web page processed: ${chunks.length} chunks from ${url}`);
      
      return {
        title: title,
        content: cleanContent,
        chunks,
        metadata: {
          fileSize: response.data.length,
          fileType: 'webpage',
          originalName: title,
          url: url,
          wordCount: this.countWords(cleanContent)
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Web page processing failed for ${url}:`, error);
      throw new Error(`Failed to process web page: ${errorMessage}`);
    }
  }

  // Extract title from HTML - FIXED TYPES
  private static extractTitle($: cheerio.Root): string {
    const title = $('title').first().text() ||
                  $('h1').first().text() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="title"]').attr('content') ||
                  'Untitled Web Page';
    
    return title.trim().substring(0, 200);
  }

  // Extract main content from HTML - FIXED TYPES
  private static extractMainContent($: cheerio.Root): string {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .sidebar, .navigation, .menu, .ads, .advertisement').remove();
    
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '.content',
      '.main-content',
      '.post-content',
      '.article-content',
      '#content',
      '#main',
      'body'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 100) {
        content = element.text();
        break;
      }
    }

    return content;
  }

  // Clean up extracted text
  private static cleanExtractedText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/Page \d+/gi, '')
      .replace(/^\d+\s*$/gm, '')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/Skip to (?:main )?content/gi, '')
      .replace(/Cookie (?:policy|notice|consent)/gi, '')
      .trim();
  }

  // Intelligent text chunking
  private static chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
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
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    if (chunks.length === 0) {
      chunks.push(text.substring(0, maxChunkSize));
    }
    
    return chunks;
  }

  // Count words in text
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  // Determine file type from extension
  private static getFileType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'docx': return 'word';
      case 'doc': return 'word';
      case 'txt': return 'text';
      case 'md': return 'markdown';
      default: return 'unknown';
    }
  }

  // Main processing entry point for files
  static async processFile(buffer: Buffer, originalName: string): Promise<ProcessedDocument> {
    const fileType = this.getFileType(originalName);
    
    switch (fileType) {
      case 'pdf':
        return this.processPDF(buffer, originalName);
      case 'word':
        return this.processWord(buffer, originalName);
      case 'text':
      case 'markdown':
        return this.processText(buffer, originalName);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  // Main processing entry point for URLs
  static async processUrl(url: string): Promise<ProcessedDocument> {
    return this.processWebPage(url);
  }
}