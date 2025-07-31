#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TechDocsSimpleStack } from '../lib/tech-docs-simple-stack';

const app = new cdk.App();

// Create the simplified infrastructure stack
new TechDocsSimpleStack(app, 'TechDocsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Tech Docs Assistant - Enhanced deployment (S3 + DynamoDB + OpenSearch + API Gateway)',
});

cdk.Tags.of(app).add('Project', 'TechDocsAssistant');
cdk.Tags.of(app).add('Environment', 'Demo');