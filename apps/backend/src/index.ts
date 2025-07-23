import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRoutes } from './routes';
import { opensearchService } from './services/opensearch';
import { EmbeddingService } from './services/embeddings'; // ← This import

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'tech-docs-assistant-backend'
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize embedding service (loads AI model) ← This should be here
    console.log('Initializing embedding service...');
    await EmbeddingService.initialize();
    
    // Ensure OpenSearch index exists
    console.log('Setting up OpenSearch...');
    await opensearchService.ensureIndex();
    
    console.log('All services initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API endpoints: http://localhost:${PORT}/api`);
      console.log('Vector embeddings enabled for semantic search');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();