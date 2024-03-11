import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/utils";
import { movieReviews } from "../seed/moviereviews";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class EwdAss1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "ReviewDate", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });
    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "reviewerIx",
      sortKey: { name: "ReviewerName", type: dynamodb.AttributeType.STRING },
    });
    const getreviewbymovieId = new lambdanode.NodejsFunction(
      this,
      "GetReviewbyMovieId",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getreviewbymovieId.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );
    const getreviewbyreviewernameformovie = new lambdanode.NodejsFunction(
      this,
      "getreviewbyreviewernameformovie",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getreviewbyreviewernameformovie.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );
    const getallreviewsbyreviewer = new lambdanode.NodejsFunction(
      this,
      "getallreviewsbyreviewer",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getallreviewsbyreviewer.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );
    // const getreviewbyyearformovie = new lambdanode.NodejsFunction(
    //   this,
    //   "getreviewbyyearformovie",
    //   {
    //     architecture: lambda.Architecture.ARM_64,
    //     runtime: lambda.Runtime.NODEJS_16_X,
    //     entry: `${__dirname}/../lambdas/getreviewbyyearformovie.ts`,
    //     timeout: cdk.Duration.seconds(10),
    //     memorySize: 128,
    //     environment: {
    //       TABLE_NAME: movieReviewsTable.tableName,
    //       REGION: "eu-west-1",
    //     },
    //   }
    // );
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
    const moviesEndpoint = api.root.addResource("movies");
    const movieIdEndpoint = moviesEndpoint.addResource("{movieId}");
    
    const reviewsEndpoint = movieIdEndpoint.addResource("reviews");
    reviewsEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getreviewbymovieId, { proxy: true })
    );
    const reviewerEndpoint = reviewsEndpoint.addResource("{ReviewerName}");
    reviewerEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getreviewbyreviewernameformovie)
    );
    const allreviewsEndpoint = api.root.addResource("reviews");
    const allreviewsbyreviewerEndpoint= allreviewsEndpoint.addResource("{ReviewerName}")
    allreviewsbyreviewerEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getallreviewsbyreviewer, { proxy: true })
    );
    movieReviewsTable.grantReadData(getreviewbymovieId);
    movieReviewsTable.grantReadData(getreviewbyreviewernameformovie);
    movieReviewsTable.grantReadData(getallreviewsbyreviewer);

    new custom.AwsCustomResource(this, "moviereviewsddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [movieReviewsTable.tableName]: generateBatch(movieReviews),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of(
          "moviereviewsddbInitData"
        ), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [movieReviewsTable.tableArn],
      }),
    });
  }
}
