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
}
