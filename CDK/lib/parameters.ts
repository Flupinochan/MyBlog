export class MyBlogParam {
  env = {
    region: "us-west-2",
  };

  lambdaGenAI = {
    functionName: "GenAI",
    roleName: "Lambda-GenAI-IAMRole",
    logGroupName: "Lambda-GenAI-CloudWatchLogs",
    layerName: "Lambda-GenAI-Layer",
  };

  apiGateway = {
    restApiName: "MyBlogAPI",
    stageName: "prod",
    logGroupName: "API-Gateway-CloudWatchLogs",
  };
}
