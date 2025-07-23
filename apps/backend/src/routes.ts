import express from 'express';
import { opensearchService } from './services/opensearch';
import { claudeService } from './services/claude';

export const apiRoutes = express.Router();

// Test endpoint
apiRoutes.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend API with OpenSearch and Claude is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Search endpoint - existing functionality
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

// NEW: RAG endpoint - AI-powered Q&A
apiRoutes.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Step 1: Retrieve relevant documents
    const searchResults = await opensearchService.searchDocuments(question.trim(), 5);
    
    // Step 2: Generate AI response using retrieved context
    const ragContext = {
      query: question.trim(),
      documents: searchResults
    };
    
    const aiResponse = await claudeService.generateRAGResponse(ragContext);
    
    // Step 3: Return AI answer with sources
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

// Get all documents - existing functionality
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

// Add a new document - existing functionality
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