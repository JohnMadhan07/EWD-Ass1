import * as cdk from "aws-cdk-lib";
// import { Aws } from "aws-cdk-lib";
import { Construct } from "constructs";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import * as apig from "aws-cdk-lib/aws-apigateway";
// import * as iam from "aws-cdk-lib/aws-iam";
// import * as lambda from "aws-cdk-lib/aws-lambda";
// import * as node from "aws-cdk-lib/aws-lambda-nodejs";

export class AuthAppStack extends cdk.Stack {
  private userPoolId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, "UserPool", {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolId = userPool.userPoolId;
  }
}
