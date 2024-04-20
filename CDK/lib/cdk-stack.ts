import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import path = require("path");
import { Duration } from "aws-cdk-lib";

import { MyBlogParam } from "./parameters";
import { LambdaVersion } from "aws-cdk-lib/aws-cognito";

const param = new MyBlogParam();

export class MyBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda GenAI
    const lambdaRoleGenAI = new iam.Role(this, param.lambdaGenAI.roleName, {
      roleName: param.lambdaGenAI.roleName,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccessV2"),
      ],
    });
    const lambdaLogGroupGenAI = new logs.LogGroup(
      this,
      param.lambdaGenAI.logGroupName,
      {
        logGroupName: param.lambdaGenAI.logGroupName,
        retention: logs.RetentionDays.ONE_DAY,
        logGroupClass: logs.LogGroupClass.STANDARD,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    // layerの指定は、pythonディレクトリの1つ上のディレクトリ
    const lambdaLayerGenAI = new lambda.LayerVersion(
      this,
      param.lambdaGenAI.layerName,
      {
        layerVersionName: param.lambdaGenAI.layerName,
        code: lambda.Code.fromAsset(
          path.join(__dirname, "lambda-code/GenAILayer/")
        ),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
        description: "GenAI Layer",
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const lambdaGenAI = new lambda.Function(
      this,
      param.lambdaGenAI.functionName,
      {
        functionName: param.lambdaGenAI.functionName,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: "index.lambda_handler",
        role: lambdaRoleGenAI,
        code: lambda.Code.fromAsset(path.join(__dirname, "lambda-code/GenAI/")),
        timeout: Duration.minutes(15),
        logGroup: lambdaLogGroupGenAI,
        layers: [lambdaLayerGenAI],
      }
    );

    // API Gateway
    const apigwLogs = new logs.LogGroup(this, param.apiGateway.logGroupName, {
      logGroupName: param.apiGateway.logGroupName,
      retention: logs.RetentionDays.ONE_DAY,
      logGroupClass: logs.LogGroupClass.STANDARD,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const apigwGenAi = new apigw.LambdaRestApi(
      this,
      param.apiGateway.restApiName,
      {
        restApiName: param.apiGateway.restApiName,
        handler: lambdaGenAI,
        proxy: false,
        cloudWatchRole: true,
        cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
        endpointTypes: [apigw.EndpointType.REGIONAL],
        deployOptions: {
          stageName: "api",
          loggingLevel: apigw.MethodLoggingLevel.INFO,
          metricsEnabled: true,
          accessLogDestination: new apigw.LogGroupLogDestination(apigwLogs),
          accessLogFormat: apigw.AccessLogFormat.clf(),
        },
      }
    );

    const apiTextGen = apigwGenAi.root.addResource("textgen");
    apiTextGen.addMethod("GET");
    apiTextGen.addMethod("POST");
    const apiImageGen = apigwGenAi.root.addResource("imagegen");
    apiImageGen.addMethod("GET");
    apiImageGen.addMethod("POST");
  }
}
