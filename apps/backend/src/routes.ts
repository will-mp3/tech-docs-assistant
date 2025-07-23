import express from 'express';
import { opensearchService } from './services/opensearch';

export const apiRoutes = express.Router();

// Test endpoint
apiRoutes.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend API with OpenSearch is working!', 
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

// Add a new document
apiRoutes.post('/documents', async (req, res) => {
  try {
    const { title, content, source, technology } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const document = {
      id: Date.now().toString(), // Simple ID generation
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