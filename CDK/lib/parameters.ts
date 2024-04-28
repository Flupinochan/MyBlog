export class MyBlogParam {
  env = {
    region: "us-west-2",
  };

  lambdaGenAI = {
    functionName: "GenIMG",
    roleName: "Lambda-GenIMG-IAMRole",
    logGroupName: "Lambda-GenIMG-CloudWatchLogs",
    layerName: "Lambda-GenIMG-Layer",
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
    tableName: "MyBlog-Websocket-db",
    partitionKeyName: "connectionId",
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
}
