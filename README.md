# Technical Documentation Assistant

A production-grade RAG (Retrieval Augmented Generation) application that transforms static technical documentation into an intelligent, searchable knowledge base. Built with React, Node.js, OpenSearch, and Claude AI.

## Overview

This application demonstrates advanced full-stack development, AI integration, and cloud architecture skills. Users can upload documents, scrape web content, and ask natural language questions to receive AI-powered answers with source citations.

### Key Features

- **Multi-Modal Document Processing** - Upload PDFs, Word docs, text files, or scrape web documentation
- **Hybrid Search Engine** - Combines vector similarity with keyword matching for optimal results
- **AI-Powered Q&A** - Ask questions and get contextual answers with source citations using Claude AI
- **Document Management** - Full CRUD operations with organized library interface
- **Professional UI** - Modern React interface with real-time feedback and error handling
- **Cost-Optimized** - Approximately $0.001 per AI query using efficient architecture

## Demo

### Live Demo
- **Production:** Coming Soon (AWS Cloud Deployment)
- **Local Development:** Follow setup instructions below

### Quick Demo Flow
1. Upload technical documents (PDFs, Word docs, or scrape documentation URLs)
2. Search documents using keyword or semantic search
3. Ask natural language questions: "How do React hooks work?"
4. Get AI-powered answers with source citations
5. Manage your document library with view/delete operations

## Architecture

### Current Stack (Local Development)
```
Frontend (React + TypeScript) → Backend (Node.js + Express) → Services
                                        ↓
                               OpenSearch (Docker) + Claude AI
```

### Planned Production Stack (AWS)
```
CloudFront + S3 → API Gateway + Lambda → DynamoDB + OpenSearch Serverless
                                              ↓
                                      Cognito + Bedrock (Claude)
```

## Technology Stack

### Frontend
- **React 18** with TypeScript and Vite
- **Custom CSS** with modern design patterns
- **Axios** for API communication
- **Professional UI/UX** with loading states and error handling

### Backend
- **Node.js** with Express and TypeScript
- **Service-oriented architecture** with clear separation of concerns
- **Comprehensive error handling** and logging
- **RESTful API design** with standardized responses

### AI & Search
- **OpenSearch** for hybrid vector + keyword search
- **Xenova Transformers** for local embedding generation (all-MiniLM-L6-v2)
- **Claude AI** via Anthropic API for question answering
- **Intelligent document processing** with chunking and metadata extraction

### Document Processing
- **PDF Support** via pdf-parse
- **Word Documents** via mammoth (.docx/.doc)
- **Web Scraping** via cheerio and axios
- **Text Files** (.txt, .md)

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Docker** (for OpenSearch)
- **Anthropic API Key** (for Claude AI)

### Installation

```bash
# Clone repository
git clone https://github.com/username/tech-docs-assistant.git
cd tech-docs-assistant

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Development Setup

```bash
# Terminal 1: Start OpenSearch services
npm run dev:services

# Terminal 2: Start backend server
npm run dev:backend

# Terminal 3: Start frontend server
npm run dev:frontend
```

### Verify Installation

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080/api/test
- **OpenSearch:** http://localhost:9200
- **Dashboards:** http://localhost:5601

## Usage

### 1. Upload Documents

Choose from three upload methods:

**File Upload:**
- Drag and drop PDFs, Word docs, or text files
- Automatic text extraction and processing
- Metadata preservation (file size, page count, etc.)

**Web Scraping:**
- Enter documentation URLs (React docs, AWS docs, etc.)
- Intelligent content extraction from web pages
- Clean text processing with artifact removal

**Manual Entry:**
- Direct text input for quick content addition
- Useful for code snippets or notes

### 2. Search Documents

**Keyword Search:**
- Traditional text matching with fuzzy search
- Advanced filtering by technology, file type, date
- Intelligent excerpt generation

**AI-Powered Search:**
- Ask natural language questions
- Get contextual answers with source citations
- See AI reasoning and confidence scores

### 3. Manage Library

- View all uploaded documents in organized interface
- Click web links to open original sources
- Preview document content in modal windows
- Delete documents with confirmation prompts

## API Documentation

### Core Endpoints

**Search Documents**
```bash
POST /api/search
Content-Type: application/json

{
  "query": "React hooks",
  "technology": ["React"],
  "fileType": ["pdf", "webpage"],
  "dateRange": "month"
}
```

**Ask AI Question**
```bash
POST /api/ask
Content-Type: application/json

{
  "question": "How do React hooks work?"
}
```

**Upload Document**
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

file: [PDF/Word/Text file]
technology: "React"
source: "React Documentation"
```

**Scrape Web Content**
```bash
POST /api/documents/scrape
Content-Type: application/json

{
  "url": "https://react.dev/learn/thinking-in-react",
  "technology": "React"
}
```

See [API.md](./docs/API.md) for complete documentation.

## Project Structure

```
tech-docs-assistant/
├── apps/
│   ├── backend/                     # Node.js API server
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── embeddings.ts      # Vector embeddings
│   │   │   │   ├── fileProcessor.ts   # Document processing
│   │   │   │   ├── opensearch.ts      # Search engine
│   │   │   │   └── claude.ts          # AI integration
│   │   │   ├── routes.ts               # API endpoints
│   │   │   └── index.ts                # Server entry
│   │   └── package.json
│   └── frontend/                    # React application
│       ├── src/
│       │   ├── components/
│       │   │   ├── AIAssistant.tsx     # Q&A interface
│       │   │   ├── DocumentUpload.tsx  # Upload system
│       │   │   ├── SearchBox.tsx       # Search interface
│       │   │   ├── SearchResults.tsx   # Result display
│       │   │   └── DocumentManager.tsx # Library management
│       │   ├── services/
│       │   │   └── api.ts              # API client
│       │   └── App.tsx
│       └── package.json
├── packages/cdk/                   # AWS infrastructure (planned)
├── docker/                         # Local services
├── docs/                          # Documentation
│   ├── API.md                     # API documentation
│   ├── ARCHITECTURE.md            # System architecture
│   ├── DEVELOPMENT.md             # Development guide
│   └── DEPLOYMENT.md              # Deployment guide
└── package.json                   # Workspace config
```

## Development

### Available Scripts

```bash
# Development
npm run dev:frontend      # React dev server (port 5173)
npm run dev:backend       # Node.js with auto-reload (port 8080)
npm run dev:services      # Docker services (OpenSearch)

# Services Management
npm run stop:services     # Stop Docker containers
npm run reset:services    # Reset with fresh data

# Production
npm run build            # Build both apps for production
npm test                # Run test suite (coming soon)
```

### Code Standards

- **TypeScript throughout** - Full type safety
- **ESLint configuration** - Consistent code style
- **Service-oriented architecture** - Clear separation of concerns
- **Comprehensive error handling** - User-friendly error messages
- **Professional logging** - Structured console output

## Deployment

### Current: Local Development
- Single-user local environment
- Docker-based services
- Development-optimized configuration

### Planned: AWS Production
- Multi-user cloud deployment
- Serverless architecture (Lambda + API Gateway)
- User authentication (Cognito)
- Managed services (DynamoDB, OpenSearch Serverless, Bedrock)
- Global CDN (CloudFront)

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment strategies.

## Cost Analysis

### Development Costs
- **Local Development:** Free (except Anthropic API)
- **Claude AI Usage:** ~$0.001 per query
- **Monthly Development:** ~$5-15 for testing

### Production Costs (Estimated)
- **AWS Infrastructure:** ~$30-60/month
- **Light Usage:** Very cost-effective with serverless pricing
- **Demo/Portfolio Usage:** Easily manageable costs

## Performance

### Response Times
- **Document Upload:** 2-10 seconds (file size dependent)
- **Search Queries:** 200-800ms
- **AI Questions:** 1-3 seconds
- **Document Management:** 100-300ms

### Scalability
- **Current:** Single-user local development
- **Planned:** Auto-scaling serverless architecture
- **Storage:** Designed for thousands of documents per user

## Security

### Current (Local)
- Input validation and sanitization
- File type and size restrictions
- CORS configuration
- Error message sanitization

### Planned (Production)
- AWS Cognito user authentication
- User data isolation
- API rate limiting
- HTTPS encryption
- IAM role-based access control

## Contributing

### Development Workflow
1. Create feature branch from `main`
2. Make changes with comprehensive testing
3. Update documentation as needed
4. Submit pull request with detailed description

### Code Contributions
- Follow existing TypeScript and React patterns
- Add appropriate error handling
- Include JSDoc comments for complex functions
- Ensure responsive design for new UI components

## Branches

- **`main`** - Stable production-ready code
- **`legacy-local-development`** - Working local version for demos
- **`cloud-migration`** - AWS deployment work in progress

## Troubleshooting

### Common Issues

**OpenSearch won't start:**
```bash
# Check Docker status
docker ps

# Restart services
npm run reset:services

# Check available memory (OpenSearch needs ~2GB)
```

**Embedding model loading fails:**
```bash
# Check internet connection (downloads model on first run)
# Verify Node.js memory limits
# Look for "Embedding model loaded successfully" message
```

**API connection issues:**
```bash
# Verify all services are running
# Check CORS configuration
# Test API endpoint directly: curl http://localhost:8080/api/test
```

**Frontend build issues:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

## Documentation

- **[API Documentation](./docs/API.md)** - Complete API reference
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and data flow
- **[Development Guide](./docs/DEVELOPMENT.md)** - Setup and development workflow
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Local and cloud deployment

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Contact

For questions, suggestions, or collaboration opportunities, please open an issue or reach out directly.

---

**Built with modern technologies and production-ready practices to demonstrate advanced full-stack development, AI integration, and cloud architecture capabilities.**
