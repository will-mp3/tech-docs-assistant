import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TechDocsSimpleStack extends cdk.Stack {
  public readonly documentsBucket: s3.Bucket;
  public readonly documentsTable: dynamodb.Table;
  public readonly usersTable: dynamodb.Table;
  public readonly searchCollection: opensearch.CfnCollection;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for storing uploaded documents
    this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `tech-docs-documents-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [{
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.POST,
          s3.HttpMethods.PUT,
          s3.HttpMethods.DELETE,
        ],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // S3 Bucket for hosting the React frontend (private for now)
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `tech-docs-website-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // DynamoDB Tables - Create BOTH tables first
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
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false },
    });

    // Add Global Secondary Index
    this.documentsTable.addGlobalSecondaryIndex({
      indexName: 'DocumentIdIndex',
      partitionKey: {
        name: 'documentId',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Users table
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

    // OpenSearch Serverless Collection for search
    // Create security policies first
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

    this.searchCollection.addDependency(encryptionPolicy);
    this.searchCollection.addDependency(networkPolicy);

    // IAM role for Lambda functions - Create AFTER all resources it references
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
                `${this.documentsTable.tableArn}/index/*`,
                this.usersTable.tableArn,
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
      },
    });

    // Data access policy for OpenSearch (allows Lambda role to access)
    new opensearch.CfnAccessPolicy(this, 'DataAccessPolicy', {
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

    // API Gateway for Lambda functions
    this.api = new apigateway.RestApi(this, 'TechDocsApi', {
      restApiName: 'Tech Docs Assistant API',
      description: 'API for tech docs assistant RAG application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      description: 'S3 bucket for storing documents',
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket for hosting website',
    });

    new cdk.CfnOutput(this, 'DocumentsTableName', {
      value: this.documentsTable.tableName,
      description: 'DynamoDB table for document metadata',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'DynamoDB table for user data',
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'IAM role for Lambda functions',
    });

    new cdk.CfnOutput(this, 'SearchCollectionEndpoint', {
      value: this.searchCollection.attrCollectionEndpoint,
      description: 'OpenSearch Serverless collection endpoint',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
    });
  }
}