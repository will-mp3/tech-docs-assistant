import express from 'express';
import multer from 'multer';
import { opensearchService } from './services/opensearch';
import { claudeService } from './services/claude';
import { FileProcessor } from './services/fileProcessor';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/octet-stream'
    ];
    
    const allowedExtensions = ['.pdf', '.txt', '.md'];
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (allowedTypes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  }
});

export const apiRoutes = express.Router();

// Test endpoint
apiRoutes.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend API with OpenSearch, Claude, and file upload is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Search endpoint
apiRoutes.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await opensearchService.searchDocuments(query.trim());
    
    res.json({
      query: query,
      results: results,
      totalResults: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// RAG endpoint
apiRoutes.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const searchResults = await opensearchService.searchDocuments(question.trim(), 5);
    
    const ragContext = {
      query: question.trim(),
      documents: searchResults
    };
    
    const aiResponse = await claudeService.generateRAGResponse(ragContext);
    
    res.json({
      question: question,
      answer: aiResponse.answer,
      reasoning: aiResponse.reasoning,
      sources: searchResults.map(doc => ({
        title: doc.title,
        source: doc.source,
        relevance: Math.round(doc.score * 100)
      })),
      totalSources: searchResults.length
    });
    
  } catch (error) {
    console.error('RAG error:', error);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});

// File upload endpoint
apiRoutes.post('/documents/upload', (req: any, res: any) => {
  const uploadMiddleware = upload.single('file');
  
  uploadMiddleware(req, res, async (err: any) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const technology = req.body?.technology || 'General';
      const source = req.body?.source || `Uploaded file: ${req.file.originalname}`;
      
      console.log(`File upload received: ${req.file.originalname} (${req.file.size} bytes)`);
      
      // Process the uploaded file
      const processedDoc = await FileProcessor.processFile(req.file.buffer, req.file.originalname);
      
      // Create document for indexing
      const document = {
        id: Date.now().toString(),
        title: processedDoc.title,
        content: processedDoc.content,
        source: source,
        technology: technology,
        timestamp: new Date().toISOString(),
        metadata: processedDoc.metadata
      };

      // Index the document
      await opensearchService.indexDocument(document);
      
      res.status(201).json({
        message: 'File uploaded and processed successfully',
        document: {
          id: document.id,
          title: document.title,
          chunks: processedDoc.chunks.length,
          pages: processedDoc.metadata.pageCount || 'N/A',
          fileType: processedDoc.metadata.fileType,
          size: processedDoc.metadata.fileSize
        }
      });
      
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        error: 'Failed to process file',
        details: errorMessage
      });
    }
  });
});

// Add document manually
apiRoutes.post('/documents', async (req, res) => {
  try {
    const { title, content, source, technology } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const document = {
      id: Date.now().toString(),
      title,
      content,
      source: source || 'Manual entry',
      technology: technology || 'General',
      timestamp: new Date().toISOString()
    };

    await opensearchService.indexDocument(document);
    
    res.status(201).json({
      message: 'Document added successfully',
      document: document
    });
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// Get all documents
apiRoutes.get('/documents', async (req, res) => {
  try {
    const documents = await opensearchService.getAllDocuments();
    res.json({
      documents: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});