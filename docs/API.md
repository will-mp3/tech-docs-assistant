# API Documentation

## Base URL
- **Local Development:** `http://localhost:8080/api`
- **Production:** `https://api.tech-docs-assistant.com/api` (Coming Soon)

## Authentication
- **Current:** No authentication required (local development)
- **Production:** JWT tokens via AWS Cognito (planned)

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message description",
  "details": "Additional error details when available"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Endpoints

### Health Check

**GET** `/test`

Returns API status and timestamp.

**Response:**
```json
{
  "message": "Backend API with OpenSearch, Claude, and file upload is working!",
  "timestamp": "2025-01-26T20:30:00.000Z"
}
```

### Search Documents

**POST** `/search`

Search documents using hybrid vector and keyword search with optional filters.

**Request Body:**
```json
{
  "query": "React hooks",
  "technology": ["React", "JavaScript"],
  "fileType": ["pdf", "webpage"],
  "dateRange": "month",
  "sortBy": "relevance"
}
```

**Parameters:**
- `query` (string, required) - Search query
- `technology` (array, optional) - Filter by technology tags
- `fileType` (array, optional) - Filter by file types: pdf, word, text, webpage, manual
- `dateRange` (string, optional) - Filter by date: week, month, year, all
- `sortBy` (string, optional) - Sort results: relevance, date, title

**Response:**
```json
{
  "query": "React hooks",
  "filters": {
    "technology": ["React"],
    "fileType": ["webpage"],
    "dateRange": "month",
    "sortBy": "relevance"
  },
  "results": [
    {
      "id": "doc123",
      "title": "React Hooks Guide",
      "content": "React hooks allow you to use state...",
      "source": "https://react.dev/hooks",
      "technology": "React",
      "score": 0.95
    }
  ],
  "totalResults": 1
}
```

### AI Question Answering (RAG)

**POST** `/ask`

Ask questions about uploaded documents using AI-powered retrieval augmented generation.

**Request Body:**
```json
{
  "question": "How do React hooks work?"
}
```

**Response:**
```json
{
  "question": "How do React hooks work?",
  "answer": "React hooks are functions that let you use state and other React features...",
  "reasoning": "Based on the React documentation and examples in your uploaded documents...",
  "sources": [
    {
      "title": "React Hooks Documentation",
      "source": "https://react.dev/hooks",
      "relevance": 95
    }
  ],
  "totalSources": 1
}
```

### File Upload

**POST** `/documents/upload`

Upload and process documents (PDF, Word, text files).

**Request:**
- Content-Type: `multipart/form-data`
- File field: `file`
- Optional fields: `technology`, `source`

**Response:**
```json
{
  "message": "File uploaded and processed successfully",
  "document": {
    "id": "1643234567890",
    "title": "React Best Practices",
    "chunks": 15,
    "pages": 10,
    "fileType": "pdf",
    "size": 2048576
  }
}
```

### Web Scraping

**POST** `/documents/scrape`

Scrape and index content from web URLs.

**Request Body:**
```json
{
  "url": "https://react.dev/learn/thinking-in-react",
  "technology": "React",
  "source": "React Official Documentation"
}
```

**Response:**
```json
{
  "message": "Web page scraped and processed successfully",
  "document": {
    "id": "1643234567891",
    "title": "Thinking in React",
    "chunks": 8,
    "wordCount": 1250,
    "fileType": "webpage",
    "url": "https://react.dev/learn/thinking-in-react"
  }
}
```

### Manual Document Entry

**POST** `/documents`

Add documents manually via text input.

**Request Body:**
```json
{
  "title": "TypeScript Best Practices",
  "content": "Here are the key TypeScript best practices...",
  "source": "Internal documentation",
  "technology": "TypeScript"
}
```

**Response:**
```json
{
  "message": "Document added successfully",
  "document": {
    "id": "1643234567892",
    "title": "TypeScript Best Practices",
    "content": "Here are the key TypeScript best practices...",
    "source": "Internal documentation",
    "technology": "TypeScript",
    "timestamp": "2025-01-26T20:30:00.000Z"
  }
}
```

### Get All Documents

**GET** `/documents`

Retrieve all indexed documents with metadata.

**Response:**
```json
{
  "documents": [
    {
      "id": "1643234567890",
      "title": "React Best Practices",
      "content": "Complete document content...",
      "source": "Uploaded file: react-guide.pdf",
      "technology": "React",
      "timestamp": "2025-01-26T20:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Delete Document

**DELETE** `/documents/:id`

Remove a document from the knowledge base.

**Parameters:**
- `id` (string, required) - Document ID

**Response:**
```json
{
  "message": "Document deleted successfully",
  "id": "1643234567890"
}
```

## Rate Limits

- **Current:** No rate limiting (local development)
- **Production:** 100 requests per minute per user (planned)

## File Upload Limits

- **Maximum file size:** 50MB
- **Supported formats:** PDF, Word (.docx, .doc), Text (.txt, .md)
- **Processing timeout:** 30 seconds

## Search Capabilities

### Hybrid Search Algorithm
The search endpoint uses a sophisticated hybrid approach:

1. **Vector Search:** Semantic similarity using embeddings
2. **Keyword Search:** Traditional text matching with fuzzy search
3. **Result Merging:** Combines and deduplicates results
4. **Intelligent Excerpts:** Generates contextual content snippets
5. **Relevance Scoring:** Transparent confidence percentages

### Search Filters
- **Technology:** Filter by programming languages, frameworks, tools
- **File Type:** Filter by document source type
- **Date Range:** Filter by upload/index date
- **Sorting:** Order by relevance, date, or title

## AI Integration

### Claude AI Configuration
- **Model:** Claude Haiku (cost-optimized)
- **Max tokens:** 1000 output tokens
- **Temperature:** 0.3 (focused responses)
- **Cost:** Approximately $0.001 per query

### RAG Pipeline
1. **Query Processing:** Extract intent and keywords
2. **Document Retrieval:** Find relevant document chunks
3. **Context Building:** Assemble context for AI
4. **Response Generation:** Generate answer with sources
5. **Citation:** Link responses to source documents
