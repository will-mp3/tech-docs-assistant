import express from 'express';

export const apiRoutes = express.Router();

// Test endpoint
apiRoutes.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend API is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Search endpoint (placeholder for now)
apiRoutes.post('/search', (req, res) => {
  const { query } = req.body;
  
  // Mock response for now
  res.json({
    query: query,
    results: [
      {
        id: '1',
        title: 'React Documentation',
        content: 'React is a JavaScript library for building user interfaces...',
        source: 'https://reactjs.org',
        score: 0.95
      },
      {
        id: '2', 
        title: 'TypeScript Handbook',
        content: 'TypeScript is a typed superset of JavaScript...',
        source: 'https://typescriptlang.org',
        score: 0.87
      }
    ],
    totalResults: 2
  });
});

// Documents endpoint (placeholder)
apiRoutes.get('/documents', (req, res) => {
  res.json({
    documents: [
      { id: '1', title: 'React Documentation', technology: 'React' },
      { id: '2', title: 'TypeScript Handbook', technology: 'TypeScript' }
    ],
    count: 2
  });
});