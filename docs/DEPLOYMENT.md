# Deployment Guide

## Overview

This document covers deployment strategies for the Technical Documentation Assistant, from local development to production AWS deployment.

## Current Status: Local Development

### Local Development Environment

The application currently runs entirely on localhost with the following services:

- **Frontend:** React development server (localhost:5173)
- **Backend:** Node.js Express server (localhost:8080)
- **OpenSearch:** Docker container (localhost:9200)
- **OpenSearch Dashboards:** Docker container (localhost:5601)

### Local Deployment Commands

```bash
# Start all services for development
npm run dev:services     # Start OpenSearch containers
npm run dev:backend      # Start Node.js server with hot reload
npm run dev:frontend     # Start React development server

# Production-like local build
npm run build           # Build both frontend and backend
cd apps/backend && npm start    # Run production backend
cd apps/frontend && npm run preview  # Serve built frontend
```

## Production Deployment: AWS Cloud Migration

### Target Architecture

The planned production deployment uses AWS serverless architecture:

```
Internet → CloudFront → S3 (Static Site) → API Gateway → Lambda Functions
                                                ↓
                                        AWS Services:
                                        - DynamoDB (Metadata)
                                        - OpenSearch Serverless (Search)
                                        - S3 (File Storage)
                                        - Cognito (Authentication)
                                        - Bedrock (AI)
```

### AWS Services Configuration

#### Frontend Deployment
- **S3 Static Website:** Host built React application
- **CloudFront CDN:** Global content distribution
- **Route 53:** Custom domain management (optional)
- **SSL Certificate:** HTTPS encryption via Certificate Manager

#### Backend Deployment
- **API Gateway:** RESTful API endpoints
- **Lambda Functions:** Serverless compute for each route
- **IAM Roles:** Secure service-to-service communication
- **CloudWatch:** Logging and monitoring

#### Data Services
- **DynamoDB:** User metadata and document references
- **OpenSearch Serverless:** Vector search and document indexing
- **S3 Buckets:** Raw document file storage
- **Cognito User Pools:** User authentication and management

#### AI Services
- **Amazon Bedrock:** Claude AI model access
- **Lambda Layers:** Shared embedding model code
- **EventBridge:** Asynchronous document processing

### Infrastructure as Code (CDK)

The deployment uses AWS CDK for reproducible infrastructure:

```typescript
// Planned CDK stack structure
export class TechDocsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // S3 bucket for static website
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket');

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution');

    // API Gateway
    const api = new apigateway.RestApi(this, 'TechDocsApi');

    // Lambda functions
    const searchFunction = new lambda.Function(this, 'SearchFunction');
    const uploadFunction = new lambda.Function(this, 'UploadFunction');

    // DynamoDB tables
    const documentsTable = new dynamodb.Table(this, 'DocumentsTable');

    // OpenSearch domain
    const searchDomain = new opensearch.Domain(this, 'SearchDomain');

    // Cognito user pool
    const userPool = new cognito.UserPool(this, 'UserPool');
  }
}
```

### Migration Strategy

#### Phase 1: Infrastructure Setup (Week 1)

**Goals:**
- Set up AWS CDK project structure
- Deploy basic infrastructure components
- Configure networking and security

**Tasks:**
```bash
# Initialize CDK project
npx aws-cdk init app --language typescript

# Install required CDK modules
npm install @aws-cdk/aws-lambda @aws-cdk/aws-s3 @aws-cdk/aws-dynamodb

# Deploy basic infrastructure
cdk deploy --profile your-aws-profile
```

**Deliverables:**
- CDK stack with core AWS services
- S3 buckets for static hosting and file storage
- DynamoDB tables for metadata
- Basic API Gateway setup

#### Phase 2: Backend Migration (Week 2)

**Goals:**
- Convert Express routes to Lambda functions
- Implement user authentication with Cognito
- Migrate document processing to serverless

**Code Changes:**
```typescript
// Before: Express route
app.post('/search', async (req, res) => {
  const results = await opensearchService.search(req.body.query);
  res.json(results);
});

// After: Lambda function
export const searchHandler = async (event: APIGatewayEvent) => {
  const user = await validateCognitoToken(event.headers.Authorization);
  const body = JSON.parse(event.body || '{}');
  
  const results = await opensearchService.searchUserDocuments(
    user.sub, 
    body.query
  );
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(results)
  };
};
```

**Tasks:**
- Refactor each API route as a
