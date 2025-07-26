# Development Guide

## Prerequisites

### Required Software
- **Node.js:** Version 18 or higher
- **npm:** Version 8 or higher (included with Node.js)
- **Docker:** For running local services
- **Git:** For version control

### Recommended Tools
- **VS Code:** IDE with TypeScript support
- **Docker Desktop:** GUI for Docker management
- **Postman/Thunder Client:** API testing
- **OpenSearch Dashboards:** Search index inspection

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/username/tech-docs-assistant.git
cd tech-docs-assistant
```

### 2. Install Dependencies

```bash
# Install root dependencies and workspace packages
npm install

# This installs dependencies for both frontend and backend
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Required: ANTHROPIC_API_KEY for Claude AI integration
```

### 4. Start Development Services

```bash
# Start OpenSearch and Dashboards
npm run dev:services

# Wait for services to be ready (30-60 seconds)
# OpenSearch: http://localhost:9200
# Dashboards: http://localhost:5601
```

### 5. Start Development Servers

```bash
# Terminal 1: Start backend server
npm run dev:backend

# Terminal 2: Start frontend server
npm run dev:frontend
```

### 6. Verify Setup

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080/api/test
- **OpenSearch:** http://localhost:9200
- **Dashboards:** http://localhost:5601

## Development Workflow

### Project Structure

```
tech-docs-assistant/
├── apps/
│   ├── backend/                 # Node.js API server
│   │   ├── src/
│   │   │   ├── services/        # Business logic services
│   │   │   ├── routes.ts        # API route definitions
│   │   │   └── index.ts         # Server entry point
│   │   └── package.json
│   └── frontend/                # React application
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── services/        # API client code
│       │   └── App.tsx          # Main application
│       └── package.json
├── packages/
│   └── cdk/                     # AWS infrastructure (future)
├── docker/
│   └── docker-compose.yml       # Local services
└── package.json                 # Workspace configuration
```

### Development Commands

```bash
# Start individual services
npm run dev:frontend      # React development server
npm run dev:backend       # Node.js with auto-reload
npm run dev:services      # Docker services (OpenSearch)

# Stop services
npm run stop:services     # Stop Docker services

# Reset services (clear data)
npm run reset:services    # Stop, remove volumes, restart

# Build for production
npm run build            # Build both frontend and backend
```

### Code Standards

#### TypeScript Configuration
- **Strict mode enabled:** Full type checking
- **ES2020 target:** Modern JavaScript features
- **Module resolution:** Node.js style imports
- **Source maps:** Enabled for debugging

#### Code Style
- **ESLint:** Configured for TypeScript and React
- **Import organization:** Grouped by type (external, internal, relative)
- **Error handling:** Comprehensive try-catch blocks
- **Logging:** Structured console logging with context

#### Component Patterns
- **Functional components:** React hooks for state management
- **TypeScript interfaces:** Strongly typed component props
- **Custom hooks:** Reusable state logic
- **Error boundaries:** Graceful error handling

## Backend Development

### Service Architecture

Each backend service has a specific responsibility:

#### Embedding Service
```typescript
// Initialize embedding model
await EmbeddingService.initialize();

// Generate embeddings
const embedding = await EmbeddingService.generateEmbedding(text);

// Calculate similarity
const similarity = EmbeddingService.cosineSimilarity(vec1, vec2);
```

#### File Processing Service
```typescript
// Process different file types
const processed = await FileProcessor.processFile(buffer, filename);
const webContent = await FileProcessor.processUrl(url);

// Result includes title, content, chunks, metadata
```

#### OpenSearch Service
```typescript
// Index documents with embeddings
await opensearchService.indexDocument(document);

// Hybrid search
const results = await opensearchService.searchDocuments(query);

// Filtered search
const filtered = await opensearchService.searchDocumentsWithFilters(query, filters);
```

#### Claude Service
```typescript
// Generate AI responses
const response = await claudeService.generateRAGResponse({
  query: question,
  documents: searchResults
});
```

### API Development

#### Adding New Endpoints

1. **Define route in routes.ts:**
```typescript
apiRoutes.post('/new-endpoint', async (req, res) => {
  try {
    // Validate input
    const { param } = req.body;
    if (!param) {
      return res.status(400).json({ error: 'Parameter required' });
    }

    // Process request
    const result = await someService.process(param);

    // Return response
    res.json({ success: true, result });
  } catch (error) {
    console.error('Endpoint error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

2. **Add TypeScript types:**
```typescript
// In api.ts
export interface NewEndpointRequest {
  param: string;
}

export interface NewEndpointResponse {
  success: boolean;
  result: any;
}
```

3. **Add API client method:**
```typescript
// In api.ts
export const apiService = {
  newEndpoint: async (request: NewEndpointRequest): Promise<NewEndpointResponse> => {
    const response = await api.post<NewEndpointResponse>('/new-endpoint', request);
    return response.data;
  }
};
```

### Database Operations

#### OpenSearch Index Management
```typescript
// Create index with mappings
await opensearchService.ensureIndex();

// Index documents with metadata
await opensearchService.indexDocument({
  id: 'unique-id',
  title: 'Document Title',
  content: 'Document content...',
  source: 'source-reference',
  technology: 'React',
  timestamp: new Date().toISOString()
});

// Search with various strategies
const results = await opensearchService.searchDocuments(query, size);
```

## Frontend Development

### Component Development

#### Creating New Components
```typescript
// Component template
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export const NewComponent: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<StateType>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Component initialization
  }, []);

  const handleAction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.someMethod();
      setState(result);
    } catch (err) {
      console.error('Action error:', err);
      setError('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

#### State Management Patterns
- **Local state:** useState for component-specific data
- **Side effects:** useEffect for API calls and subscriptions
- **Error handling:** Consistent error state management
- **Loading states:** User feedback during async operations

### API Integration

#### Making API Calls
```typescript
// In components
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const response = await apiService.getData();
      setData(response.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);
```

#### Error Handling
```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    setLoading(true);
    setError(null);
    
    await apiService.submitData(formData);
    
    // Success feedback
    setSuccessMessage('Data submitted successfully');
  } catch (error) {
    // Error handling
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(`Failed to submit: ${message}`);
  } finally {
    setLoading(false);
  }
};
```

## Testing and Debugging

### Manual Testing Workflow

1. **Start all services**
2. **Test document upload:** PDF, Word, text files
3. **Test web scraping:** Add URLs from documentation sites
4. **Test search functionality:** Various query types
5. **Test AI questions:** Ask about uploaded documents
6. **Test document management:** View, delete operations

### Debugging Tips

#### Backend Debugging
```bash
# Check OpenSearch status
curl http://localhost:9200/_cluster/health

# View indexed documents
curl http://localhost:9200/documents/_search

# Check API endpoints
curl http://localhost:8080/api/test
```

#### Frontend Debugging
- **Browser DevTools:** Network tab for API calls
- **React DevTools:** Component state inspection
- **Console logging:** Strategic console.log placement
- **TypeScript errors:** Address compile-time issues

#### Common Issues

**OpenSearch not starting:**
```bash
# Check Docker status
docker ps

# Restart services
npm run reset:services

# Check logs
docker logs tech-docs-opensearch
```

**Embedding model issues:**
```bash
# Check model initialization logs
# Look for "Embedding model loaded successfully"

# Verify model files
# Check ~/.cache/huggingface/ directory
```

**API connection issues:**
```bash
# Check CORS configuration
# Verify API_BASE_URL in frontend

# Test direct API calls
curl -X POST http://localhost:8080/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'
```

## Performance Optimization

### Backend Optimization
- **Embedding caching:** Cache generated embeddings
- **Search result caching:** Cache frequent queries
- **Connection pooling:** Reuse database connections
- **Memory management:** Monitor embedding model memory usage

### Frontend Optimization
- **Component memoization:** React.memo for expensive components
- **Lazy loading:** Code splitting for large components
- **Debounced search:** Reduce API calls during typing
- **Image optimization:** Compress and optimize assets

## Deployment Preparation

### Local Production Build
```bash
# Build both frontend and backend
npm run build

# Test production builds locally
cd apps/backend && npm start
cd apps/frontend && npm run preview
```

### Environment Configuration
- **API endpoints:** Environment-specific URLs
- **API keys:** Secure credential management
- **Feature flags:** Toggle features per environment
- **Logging levels:** Appropriate log verbosity
