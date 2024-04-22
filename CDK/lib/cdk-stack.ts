import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
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
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
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
        environment: {
          BUCKET_NAME: param.s3BucketImgStore.bucketName,
        },
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

    const apiImageGen = apigwGenAi.root.addResource("imagegen");
    // Request with query string
    apiImageGen.addMethod("GET", new apigw.LambdaIntegration(lambdaGenAI, {
      // Integrated request settings
      proxy: false,
        // Convert query string to json for lambda
      requestTemplates: {
        "application/json": JSON.stringify({
          "positive_prompt": "$util.escapeJavaScript($input.params('positive_prompt'))",
          "negative_prompt": "$util.escapeJavaScript($input.params('negative_prompt'))"
        })
      },
        // Configuring the response from Lambda (Pass-through and return as it is.)
      integrationResponses: [
        { statusCode: "200",}
      ],
    }), {
      // Method request settings
      requestValidator: new apigw.RequestValidator(this, "validator", {
        restApi: apigwGenAi,
        requestValidatorName: "requestValidatePrompt",
        validateRequestBody: false,
        validateRequestParameters: true,
      }),
        // Query String Setting
      requestParameters: {
        "method.request.querystring.positive_prompt": true, 
        "method.request.querystring.negative_prompt": true, 
      },
        // Configuring the response from Lambda.
      methodResponses: [
        { statusCode: "200",
          responseModels: { "application/json": apigw.Model.EMPTY_MODEL },
        },
      ],
    });
    apiImageGen.addMethod("POST");

    const apiTextGen = apigwGenAi.root.addResource("textgen");
    apiTextGen.addMethod("POST");
    apiTextGen.addMethod("GET");

    // S3 for Generating Image
    const s3BucketImgStore = new s3.Bucket(
      this,
      param.s3BucketImgStore.bucketName,
      {
        bucketName: param.s3BucketImgStore.bucketName,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            enabled: true,
            expiration: Duration.days(1),
          },
        ],
      }
    );
  }
}
