import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TechDocsStack extends cdk.Stack {
  // Export these for use in other stacks later
  public readonly documentsBucket: s3.Bucket;
  public readonly searchCollection: opensearch.CfnCollection;
  public readonly documentsTable: dynamodb.Table;
  public readonly usersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Budget for cost monitoring
    /*
    new budgets.CfnBudget(this, 'TechDocsBudget', {
      budget: {
        budgetName: 'TechDocsAssistant-MonthlyBudget',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 50, // Alert if monthly costs exceed $50
          unit: 'USD',
        },
        costFilters: {
          Service: [
            'Amazon Simple Storage Service',
            'Amazon OpenSearch Service', 
            'Amazon DynamoDB',
            'AWS Lambda',
            'Amazon API Gateway',
            'Amazon CloudFront'
          ],
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80, // Alert at 80% of budget ($40)
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: 'KATABIANWILL@GMAIL.COM', 
            },
          ],
        },
        {
          notification: {
            notificationType: 'FORECASTED',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100, // Alert if forecasted to exceed 100% ($50)
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: 'YOUR_EMAIL_HERE', // Replace with your email
            },
          ],
        },
      ],
    });
    */

    // S3 Bucket for storing uploaded documents
    this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `tech-docs-documents-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // Clean up when stack is deleted
      cors: [{
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.POST,
          s3.HttpMethods.PUT,
          s3.HttpMethods.DELETE,
        ],
        allowedOrigins: ['*'], // We'll restrict this later with CloudFront
        allowedHeaders: ['*'],
      }],
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // S3 Bucket for hosting the React frontend
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `tech-docs-website-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
    });

    // OpenSearch Serverless Collection for search
    // First, create the security policy
    const encryptionPolicy = new opensearch.CfnSecurityPolicy(this, 'EncryptionPolicy', {
      name: 'tech-docs-encryption-policy',
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [
          {
            ResourceType: 'collection',
            Resource: ['collection/tech-docs-search']
          }
        ],
        AWSOwnedKey: true
      })
    });

    // Network security policy (allows public access for demo)
    const networkPolicy = new opensearch.CfnSecurityPolicy(this, 'NetworkPolicy', {
      name: 'tech-docs-network-policy',
      type: 'network',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: ['collection/tech-docs-search']
            }
          ],
          AllowFromPublic: true
        }
      ])
    });

    // Create the OpenSearch Serverless collection
    this.searchCollection = new opensearch.CfnCollection(this, 'SearchCollection', {
      name: 'tech-docs-search',
      type: 'SEARCH',
      description: 'Search collection for tech docs assistant',
    });

    // Collection depends on security policies
    this.searchCollection.addDependency(encryptionPolicy);
    this.searchCollection.addDependency(networkPolicy);

    // DynamoDB Tables for user data
    
    // Documents table - stores metadata for each uploaded document
    this.documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
      tableName: 'tech-docs-documents',
      partitionKey: { 
        name: 'userId', 
        type: dynamodb.AttributeType.STRING 
      },
      sortKey: { 
        name: 'documentId', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Cost-effective for demos
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false }, // Keep costs low
    });

    // Add Global Secondary Index after table creation (CDK v2 syntax)
    this.documentsTable.addGlobalSecondaryIndex({
      indexName: 'DocumentIdIndex',
      partitionKey: {
        name: 'documentId',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Users table - stores user profiles and preferences
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'tech-docs-users',
      partitionKey: { 
        name: 'userId', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false },
    });

    // IAM role for Lambda functions to access OpenSearch and S3
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                this.documentsBucket.bucketArn,
                `${this.documentsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        OpenSearchAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'aoss:*', // OpenSearch Serverless permissions
              ],
              resources: [this.searchCollection.attrArn],
            }),
          ],
        }),
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                this.documentsTable.tableArn,
                `${this.documentsTable.tableArn}/index/*`, // For GSI access
                this.usersTable.tableArn,
              ],
            }),
          ],
        }),
      },
    });

    // Data access policy for OpenSearch (allows our Lambda role to access)
    const dataAccessPolicy = new opensearch.CfnAccessPolicy(this, 'DataAccessPolicy', {
      name: 'tech-docs-data-access-policy',
      type: 'data',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: ['collection/tech-docs-search'],
              Permission: [
                'aoss:CreateCollectionItems',
                'aoss:DeleteCollectionItems',
                'aoss:UpdateCollectionItems',
                'aoss:DescribeCollectionItems'
              ]
            },
            {
              ResourceType: 'index',
              Resource: ['index/tech-docs-search/*'],
              Permission: [
                'aoss:CreateIndex',
                'aoss:DeleteIndex',
                'aoss:UpdateIndex',
                'aoss:DescribeIndex',
                'aoss:ReadDocument',
                'aoss:WriteDocument'
              ]
            }
          ],
          Principal: [lambdaRole.roleArn]
        }
      ])
    });

    // Outputs for reference
    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      description: 'S3 bucket for storing documents',
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket for hosting website',
    });

    new cdk.CfnOutput(this, 'SearchCollectionEndpoint', {
      value: this.searchCollection.attrCollectionEndpoint,
      description: 'OpenSearch Serverless collection endpoint',
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'IAM role for Lambda functions',
    });

    new cdk.CfnOutput(this, 'DocumentsTableName', {
      value: this.documentsTable.tableName,
      description: 'DynamoDB table for document metadata',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'DynamoDB table for user data',
    });
  }
}