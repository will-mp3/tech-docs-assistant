# System Architecture

## Overview

The Technical Documentation Assistant is built using a modern full-stack architecture with AI-powered search capabilities. The system implements Retrieval Augmented Generation (RAG) to provide intelligent question-answering over uploaded technical documents.

## Current Architecture (Local Development)

### High-Level Architecture

```
Frontend (React)  →  Backend (Node.js/Express)  →  Services
     ↓                        ↓                      ↓
   Port 5173              Port 8080           Docker Services
                                                     ↓
                                              OpenSearch (9200)
                                              Dashboards (5601)
```

### Component Architecture

#### Frontend Layer
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and building
- **State Management:** React hooks (useState, useEffect)
- **HTTP Client:** Axios for API communication
- **Styling:** Custom CSS with modern design patterns

#### Backend Layer
- **Runtime:** Node.js with Express.js framework
- **Language:** TypeScript for type safety
- **Architecture Pattern:** Service-oriented architecture
- **File Processing:** Multer for multipart form handling
- **CORS:** Configured for local development

#### Service Layer

**Embedding Service (`embeddings.ts`)**
- **Purpose:** Generate vector embeddings for semantic search
- **Technology:** Xenova Transformers library
- **Model:** all-MiniLM-L6-v2 (384-dimensional embeddings)
- **Features:** Local model execution, cosine similarity calculation

**File Processor (`fileProcessor.ts`)**
- **Purpose:** Extract and process content from multiple file formats
- **Supported Formats:** PDF, Word documents, text files, web pages
- **Features:** Intelligent text chunking, metadata extraction, content cleaning
- **Libraries:** pdf-parse, mammoth, cheerio, axios

**OpenSearch Service (`opensearch.ts`)**
- **Purpose:** Hybrid search combining vector and keyword matching
- **Features:** Document indexing, search result ranking, excerpt generation
- **Search Strategy:** Semantic similarity + keyword matching + result merging

**Claude Service (`claude.ts`)**
- **Purpose:** AI-powered question answering with document context
- **Provider:** Anthropic Claude API (Haiku model)
- **Features:** RAG implementation, cost tracking, usage logging

#### Data Layer
- **Search Engine:** OpenSearch with vector field support
- **Vector Storage:** 384-dimensional embeddings with HNSW indexing
- **Document Storage:** OpenSearch document store with metadata
- **Index Configuration:** Optimized for hybrid search with keyword and vector fields

## Data Flow

### Document Processing Pipeline

```
File Upload/URL → File Processor → Text Extraction → Chunking → 
Embedding Generation → OpenSearch Indexing → Search Ready
```

1. **Input Processing:** Handle file uploads or web scraping
2. **Content Extraction:** Extract text content using format-specific parsers
3. **Text Cleaning:** Remove artifacts, normalize formatting
4. **Intelligent Chunking:** Split content into searchable segments
5. **Vector Generation:** Create embeddings for semantic search
6. **Indexing:** Store in OpenSearch with metadata

### Search Query Pipeline

```
User Query → Embedding Generation → Hybrid Search → Result Merging → 
Excerpt Generation → Response Formatting → UI Display
```

1. **Query Processing:** Generate embeddings for user query
2. **Vector Search:** Find semantically similar document chunks
3. **Keyword Search:** Perform traditional text matching
4. **Result Fusion:** Merge and deduplicate search results
5. **Excerpt Generation:** Create contextual content snippets
6. **Response Assembly:** Format results with metadata

### RAG Question-Answering Pipeline

```
Question → Document Retrieval → Context Assembly → AI Processing → 
Answer Generation → Source Attribution → Response Delivery
```

1. **Question Analysis:** Extract intent and key concepts
2. **Document Search:** Find relevant document sections
3. **Context Building:** Assemble relevant content for AI
4. **AI Processing:** Generate answer using Claude API
5. **Source Linking:** Attribute response to source documents
6. **Quality Assurance:** Validate response relevance

## Technology Stack

### Frontend Technologies
- **React 18:** Component-based UI framework
- **TypeScript:** Type-safe JavaScript development
- **Vite:** Fast build tool and development server
- **Axios:** HTTP client for API communication
- **CSS3:** Modern styling with flexbox and grid

### Backend Technologies
- **Node.js:** JavaScript runtime environment
- **Express.js:** Web application framework
- **TypeScript:** Type-safe server development
- **Multer:** Multipart form data handling

### AI/ML Technologies
- **Xenova Transformers:** Local embedding generation
- **OpenSearch:** Vector database and search engine
- **Claude API:** Large language model for Q&A
- **HNSW Algorithm:** Efficient vector similarity search

### Document Processing
- **pdf-parse:** PDF text extraction
- **mammoth:** Word document processing
- **cheerio:** Web scraping and HTML parsing
- **axios:** HTTP requests for web content

### Development Tools
- **Docker Compose:** Local service orchestration
- **npm Workspaces:** Monorepo management
- **ESLint:** Code quality and consistency
- **nodemon:** Development server auto-restart

## Security Considerations

### Current Security (Local Development)
- **CORS:** Configured for localhost origins
- **Input Validation:** File type and size restrictions
- **Error Handling:** Sanitized error messages
- **Content Filtering:** Basic HTML tag removal

### Planned Security (Production)
- **Authentication:** AWS Cognito user management
- **Authorization:** User-scoped data access
- **Input Sanitization:** Comprehensive content validation
- **Rate Limiting:** API usage controls
- **HTTPS:** Encrypted data transmission

## Performance Characteristics

### Response Times
- **Document Upload:** 2-10 seconds (depending on file size)
- **Search Queries:** 200-800ms (hybrid search)
- **AI Questions:** 1-3 seconds (including Claude API)
- **Document Retrieval:** 100-300ms

### Scalability Considerations
- **Local Limitations:** Single-user, local resources
- **Memory Usage:** Embedding model loaded in memory
- **Storage:** OpenSearch handles document volume
- **Concurrent Users:** Limited by local server capacity

## Future Architecture (AWS Cloud)

### Planned Cloud Architecture

```
CloudFront (CDN) → S3 (Static Site) → API Gateway → Lambda Functions
                                            ↓
Cognito (Auth) → DynamoDB (Metadata) → OpenSearch Serverless (Search)
                                            ↓
                                    Bedrock (Claude AI)
```

### Migration Benefits
- **Multi-user Support:** User authentication and data isolation
- **Scalability:** Auto-scaling Lambda functions
- **Cost Efficiency:** Pay-per-request pricing model
- **Global Availability:** CloudFront CDN distribution
- **Managed Services:** Reduced operational overhead

## Development Patterns

### Code Organization
- **Monorepo Structure:** Frontend and backend in single repository
- **Service Separation:** Clear boundaries between components
- **Type Safety:** TypeScript throughout the stack
- **Error Boundaries:** Comprehensive error handling

### API Design
- **RESTful Endpoints:** Standard HTTP methods and status codes
- **JSON Communication:** Structured request/response format
- **Consistent Patterns:** Uniform error handling and validation
- **Documentation:** Comprehensive API specification

### Testing Strategy
- **Manual Testing:** Interactive development testing
- **Error Scenarios:** Comprehensive error case handling
- **Performance Monitoring:** Response time tracking
- **User Experience:** Real-world usage patterns
