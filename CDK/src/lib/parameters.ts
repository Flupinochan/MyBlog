import { log } from "console";

export class MyBlogParam {
  env = {
    region: "us-west-2",
  };

  lambdaGenAI = {
    functionName: "GenIMG",
    roleName: "Lambda-GenIMG-IAMRole",
    logGroupName: "Lambda-GenIMG-CloudWatchLogs",
    layerName: "Lambda-GenIMG-Layer",
    modelNameRequest: "lambdagenimgrequest",
    modelNameResponse: "lambdagenimgresponse",
  };

  apiGateway = {
    restApiName: "MyBlogAPI",
    stageName: "prod",
    logGroupName: "API-Gateway-CloudWatchLogs",
  };

  s3BucketImgStore = {
    bucketName: "myblog-generate-image",
  };

  dynamodbTable = {
    tableName: "MyBlog-Gizi-db",
    partitionKeyName: "transcribeJob",
  };

  websocket = {
    apiName: "MyBlog-Websocket-api",
    stageName: "websocket",
    logGroupName: "MyBlog-Websocket-api-Logs",
  };

  lambdaGenGizi = {
    functionName: "GenGizi",
    roleName: "Lambda-GenGizi-IAMRole",
    logGroupName: "Lambda-GenGizi-CloudWatchLogs",
    // layerName: "Lambda-GenGiziroku-Layer",
    // ecrName: "myblog-gen-gizi",
  };
  lambdaGenGiziUpload = {
    functionName: "GenGiziUpload",
    roleName: "Lambda-GenGiziUpload-IAMRole",
    logGroupName: "Lambda-GenGiziUpload-CloudWatchLogs",
  };
  lambdaGenText = {
    functionName: "GenText",
    roleName: "Lambda-GenText-IAMRole",
    logGroupName: "Lambda-GenText-CloudWatchLogs",
    modelNameRequest: "lambdagentextrequest",
    modelNameResponse: "lambdagentextresponse",
  };
  lambdaGetKb = {
    functionName: "GetKB",
    logGroupName: "Lambda-GetKB-CloudWatchLogs",
    modelNameRequest: "lambdagetkbrequest",
    modelNameResponse: "lambdagetkbresponse",
    s3BucketName: "myblog-knowledgebase-datasource",
    modelArn: "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
    knowledgeBaseId: "BRHZWBWVBN",
    datasourceId: "8BXFRITJGP",
  };
  lambdaSES = {
    functionName: "SES",
    logGroupName: "Lambda-SES-CloudWatchLogs",
    modelNameRequest: "lambdases",
    modelNameResponse: "lambdases",
  }
  stepFunctions = {
    stepFunctionsName: "Sync-KnowledgeBase-Standard",
    logGroupName: "Sync-KnowledgeBase-CloudWatchLogs",
    stepfunctionsRole: "Sync-GetKB-StepFunctions",
    apigatewayRole: "Sync-GetKB-ApiGateway",
    modelNameResponseStart: "stepfunctionsstart",
    modelNameResponseDescribe: "stepfunctionsdescribe",
  };
  cognito = {
    userPoolName: "MyBlog-UserPool",
    userPoolClientName: "MyBlog-UserPool-Client",
    identityPoolName: "MyBlog-IdentityPool",
  };
};
