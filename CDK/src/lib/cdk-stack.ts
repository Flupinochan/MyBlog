import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import path = require("path");
import { aws_apigatewayv2 as apigatewayv2 } from "aws-cdk-lib";
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
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccessV2"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonAPIGatewayAdministrator"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonAPIGatewayInvokeFullAccess")],
      inlinePolicies: {
        inlinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["transcribe:*"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });
    const lambdaLogGroupGenAI = new logs.LogGroup(this, param.lambdaGenAI.logGroupName, {
      logGroupName: param.lambdaGenAI.logGroupName,
      retention: logs.RetentionDays.ONE_DAY,
      logGroupClass: logs.LogGroupClass.STANDARD,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    // layerの指定は、pythonディレクトリの1つ上のディレクトリ
    const lambdaLayerGenAI = new lambda.LayerVersion(this, param.lambdaGenAI.layerName, {
      layerVersionName: param.lambdaGenAI.layerName,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda-code/GenAILayer/")),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      description: "GenAI Layer",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaGenAI = new lambda.Function(this, param.lambdaGenAI.functionName, {
      functionName: param.lambdaGenAI.functionName,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "index.lambda_handler",
      role: lambdaRoleGenAI,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda-code/GenAI/")),
      timeout: Duration.minutes(15),
      logGroup: lambdaLogGroupGenAI,
      layers: [lambdaLayerGenAI],
      environment: {
        BUCKET_NAME: param.s3BucketImgStore.bucketName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Lambda GenGiziUpload
    const lambdaLogGroupGenGiziUpload = new logs.LogGroup(this, param.lambdaGenGiziUpload.logGroupName, {
      logGroupName: param.lambdaGenGiziUpload.logGroupName,
      retention: logs.RetentionDays.ONE_DAY,
      logGroupClass: logs.LogGroupClass.STANDARD,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const lambdaGenGiziUpload = new lambda.Function(this, param.lambdaGenGiziUpload.functionName, {
      functionName: param.lambdaGenGiziUpload.functionName,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "index.lambda_handler",
      role: lambdaRoleGenAI,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda-code/GenGiziUpload/")),
      timeout: Duration.minutes(15),
      logGroup: lambdaLogGroupGenGiziUpload,
      layers: [lambdaLayerGenAI],
      environment: {
        BUCKET_NAME: param.s3BucketImgStore.bucketName,
      },
      // tracing: lambda.Tracing.ACTIVE
    });

    const lambdaLogGroupGenText = new logs.LogGroup(this, param.lambdaGenText.logGroupName, {
      logGroupName: param.lambdaGenText.logGroupName,
      retention: logs.RetentionDays.ONE_DAY,
      logGroupClass: logs.LogGroupClass.STANDARD,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // LambdaGenText
    const lambdaGenText = new lambda.Function(this, param.lambdaGenText.functionName, {
      functionName: param.lambdaGenText.functionName,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "index.lambda_handler",
      role: lambdaRoleGenAI,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda-code/GenText/")),
      timeout: Duration.minutes(15),
      logGroup: lambdaLogGroupGenText,
      layers: [lambdaLayerGenAI],
      environment: {
        BUCKET_NAME: param.s3BucketImgStore.bucketName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // API Gateway
    const apigwLogs = new logs.LogGroup(this, param.apiGateway.logGroupName, {
      logGroupName: param.apiGateway.logGroupName,
      retention: logs.RetentionDays.ONE_DAY,
      logGroupClass: logs.LogGroupClass.STANDARD,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const apigwGenAi = new apigw.LambdaRestApi(this, param.apiGateway.restApiName, {
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
        tracingEnabled: true,
      },
      policy: iam.PolicyDocument.fromJson({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Deny",
            Principal: "*",
            Action: "execute-api:Invoke",
            Resource: "*",
            Condition: {
              StringNotEquals: {
                "aws:Referer": "validate-cfn",
              },
            },
          },
          {
            Effect: "Allow",
            Principal: "*",
            Action: "execute-api:Invoke",
            Resource: "*",
          },
        ],
      }),
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });

    const validatorGet = new apigw.RequestValidator(this, "validatorGet", {
      restApi: apigwGenAi,
      requestValidatorName: "requestValidateGet",
      validateRequestBody: false,
      validateRequestParameters: true,
    });

    const validatorPost = new apigw.RequestValidator(this, "validatorPost", {
      restApi: apigwGenAi,
      requestValidatorName: "requestValidatePost",
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    const apiImageGen = apigwGenAi.root.addResource("imagegen");
    // Request with query string
    apiImageGen.addMethod(
      "GET",
      new apigw.LambdaIntegration(lambdaGenAI, {
        // Integrated request settings
        proxy: false,
        // Convert query string to json for lambda
        requestTemplates: {
          "application/json": JSON.stringify({
            positive_prompt: "$util.escapeJavaScript($input.params('positive_prompt'))",
            negative_prompt: "$util.escapeJavaScript($input.params('negative_prompt'))",
          }),
        },
        // Configuring the response from Lambda (Pass-through and return as it is.)
        integrationResponses: [{ statusCode: "200" }],
      }),
      {
        // Method request settings
        requestValidator: validatorGet,
        // Query String Setting
        requestParameters: {
          "method.request.querystring.positive_prompt": true,
          "method.request.querystring.negative_prompt": true,
        },
        // Configuring the response from Lambda.
        methodResponses: [
          {
            statusCode: "200",
            responseModels: { "application/json": apigw.Model.EMPTY_MODEL },
          },
        ],
      }
    );
    const requestModelGenIMG = apigwGenAi.addModel(param.lambdaGenAI.modelNameRequest, {
      contentType: "application/json",
      modelName: param.lambdaGenAI.modelNameRequest,
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        title: param.lambdaGenAI.modelNameRequest,
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          positive_prompt: { type: apigw.JsonSchemaType.STRING },
          negative_prompt: { type: apigw.JsonSchemaType.STRING },
          size: { type: apigw.JsonSchemaType.NUMBER },
          steps: { type: apigw.JsonSchemaType.NUMBER },
          cfg_scale: { type: apigw.JsonSchemaType.NUMBER },
        },
      },
    });
    const responseModelGenIMG = apigwGenAi.addModel(param.lambdaGenAI.modelNameResponse, {
      contentType: "application/json",
      modelName: param.lambdaGenAI.modelNameResponse,
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        title: param.lambdaGenAI.modelNameResponse,
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          image: { type: apigw.JsonSchemaType.STRING },
        },
      },
    });
    // メソッドの定義は、
    // 第一引数に、メソッドの種類
    // 第二引数に、統合設定
    // 第三引数に、メソッド設定
    apiImageGen.addMethod(
      "POST",
      new apigw.LambdaIntegration(lambdaGenAI, {
        proxy: false,
        passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
        integrationResponses: [{ statusCode: "200" }],
      }),
      {
        requestModels: {
          "application/json": requestModelGenIMG,
        },
        requestValidator: validatorPost,
        methodResponses: [
          {
            statusCode: "200",
            responseModels: { "application/json": responseModelGenIMG },
          },
        ],
      }
    );

    const requestModelGenText = apigwGenAi.addModel(param.lambdaGenText.modelNameRequest, {
      contentType: "application/json",
      modelName: param.lambdaGenText.modelNameRequest,
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        title: param.lambdaGenText.modelNameRequest,
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          positive_prompt: { type: apigw.JsonSchemaType.STRING },
        },
      },
    });
    const responseModelGenText = apigwGenAi.addModel(param.lambdaGenText.modelNameResponse, {
      contentType: "application/json",
      modelName: param.lambdaGenText.modelNameResponse,
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        title: param.lambdaGenText.modelNameResponse,
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          statusCode: { type: apigw.JsonSchemaType.NUMBER },
          text: { type: apigw.JsonSchemaType.STRING },
        },
      },
    });
    const apiTextGen = apigwGenAi.root.addResource("textgen");
    apiTextGen.addMethod(
      "POST",
      new apigw.LambdaIntegration(lambdaGenText, {
        proxy: false,
        passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
        integrationResponses: [{ statusCode: "200" }],
      }),
      {
        requestModels: {
          "application/json": requestModelGenText,
        },
        requestValidator: validatorPost,
        methodResponses: [
          {
            statusCode: "200",
            responseModels: { "application/json": responseModelGenText },
          },
        ],
      }
    );
    apiTextGen.addMethod("GET");

    const movieUpload = apigwGenAi.root.addResource("movieupload");
    movieUpload.addMethod(
      "GET",
      new apigw.LambdaIntegration(lambdaGenGiziUpload, {
        proxy: false,
        // Convert query string to json for lambda
        requestTemplates: {
          "application/json": JSON.stringify({
            file_name: "$util.escapeJavaScript($input.params('file_name'))",
          }),
        },
        integrationResponses: [{ statusCode: "200" }],
      }),
      {
        // Method request settings
        requestValidator: validatorGet,
        // Query String Setting
        requestParameters: {
          "method.request.querystring.file_name": true,
        },
        // Configuring the response from Lambda.
        methodResponses: [
          {
            statusCode: "200",
            responseModels: { "application/json": apigw.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // S3 for Generating Image
    const s3BucketImgStore = new s3.Bucket(this, param.s3BucketImgStore.bucketName, {
      bucketName: param.s3BucketImgStore.bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(1),
        },
      ],
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ["https://www.metalmental.net"],
        },
      ],
    });
    const bucketStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal("transcribe.amazonaws.com")],
      actions: ["s3:GetObject"],
      resources: [s3BucketImgStore.arnForObjects("*")],
    });
    s3BucketImgStore.addToResourcePolicy(bucketStatement);

    // DynamoDB for Websocket
    const dynamoTable = new dynamodb.TableV2(this, param.dynamodbTable.tableName, {
      tableName: param.dynamodbTable.tableName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: param.dynamodbTable.partitionKeyName,
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Lambda GenGizi
    // const elasticRepository = new ecr.Repository(
    //   this,
    //   param.lambdaGenGizi.ecrName,
    //   {
    //     repositoryName: param.lambdaGenGizi.ecrName,
    //   }
    // );

    const lambdaLogGroupGenGizi = new logs.LogGroup(this, param.lambdaGenGizi.logGroupName, {
      logGroupName: param.lambdaGenGizi.logGroupName,
      retention: logs.RetentionDays.ONE_DAY,
      logGroupClass: logs.LogGroupClass.STANDARD,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    // const lambdaGenGizi = new lambda.DockerImageFunction(
    //   this,
    //   param.lambdaGenGizi.functionName,
    //   {
    //     functionName: param.lambdaGenGizi.functionName,
    //     role: lambdaRoleGenAI,
    //     code: lambda.DockerImageCode.fromImageAsset(
    //       path.join(__dirname, "../../lambda-code/GenGizi/")
    //     ),
    //     timeout: Duration.minutes(15),
    //     logGroup: lambdaLogGroupGenAI,
    //     environment: {
    //       BUCKET_NAME: param.s3BucketImgStore.bucketName,
    //     },
    //   }
    // );

    // LambdaGenGizi
    const lambdaGenGizi = new lambda.Function(this, param.lambdaGenGizi.functionName, {
      functionName: param.lambdaGenGizi.functionName,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "index.lambda_handler",
      role: lambdaRoleGenAI,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda-code/GenGizi/")),
      timeout: Duration.minutes(15),
      logGroup: lambdaLogGroupGenGizi,
      layers: [lambdaLayerGenAI],
      environment: {
        BUCKET_NAME: param.s3BucketImgStore.bucketName,
      },
      // tracing: lambda.Tracing.ACTIVE
    });

    // Websocket for Giziroku

    // const apigwv2Logs = new logs.LogGroup(this, param.websocket.logGroupName, {
    //   logGroupName: param.websocket.logGroupName,
    //   retention: logs.RetentionDays.ONE_DAY,
    //   logGroupClass: logs.LogGroupClass.STANDARD,
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    // });
    // const accessLogSettingsProperty: apigatewayv2.CfnApiGatewayManagedOverrides.AccessLogSettingsProperty =
    //   {
    //     destinationArn: apigwv2Logs.logGroupArn,
    //     format: JSON.stringify({
    //       requestId: "$context.requestId",
    //       userAgent: "$context.identity.userAgent",
    //       sourceIp: "$context.identity.sourceIp",
    //       requestTime: "$context.requestTime",
    //       requestTimeEpoch: "$context.requestTimeEpoch",
    //       httpMethod: "$context.httpMethod",
    //       path: "$context.path",
    //       status: "$context.status",
    //       protocol: "$context.protocol",
    //       responseLength: "$context.responseLength",
    //       domainName: "$context.domainName",
    //     }),
    //   };

    const webSocketApi = new apigwv2.WebSocketApi(this, param.websocket.apiName, {
      apiName: param.websocket.apiName,
      // コンソールから双方向通信を有効化することを忘れずに
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration("connect", lambdaGenGizi),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration("disconnect", lambdaGenGizi),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration("default", lambdaGenGizi),
      },
    });
    const webSocketApiStage = new apigwv2.WebSocketStage(this, param.websocket.stageName, {
      webSocketApi,
      stageName: param.websocket.stageName,
      autoDeploy: true,
    });

    // const cfnApiGatewayManagedOverrides =
    //   new apigatewayv2.CfnApiGatewayManagedOverrides(
    //     this,
    //     "MyCfnApiGatewayManagedOverrides",
    //     {
    //       apiId: webSocketApi.apiId,
    //       stage: {
    //         accessLogSettings: accessLogSettingsProperty,
    //       },
    //     }
    //   );
  }
}
