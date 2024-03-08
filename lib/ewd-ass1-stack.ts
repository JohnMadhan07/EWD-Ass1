import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/utils";
import { movieReviews } from '../seed/moviereviews';
import * as apig from "aws-cdk-lib/aws-apigateway";


export class EwdAss1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      sortKey:{name:"ReviewDate", type:dynamodb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });
    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "reviewerIx",
      sortKey: { name: "ReviewerName", type: dynamodb.AttributeType.STRING },
    });
    new custom.AwsCustomResource(this, "moviereviewsddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [movieReviewsTable.tableName]: generateBatch(movieReviews)
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviereviewsddbInitData"), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [movieReviewsTable.tableArn],
      }),
    });
     // REST API
     const api = new apig.RestApi(this, "RestAPI", {
      description: "MovieReview api",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });
  }
}
