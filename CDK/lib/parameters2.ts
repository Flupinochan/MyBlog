export class MyBlogParam2 {
  env = {
    region: "us-west-2",
  };

  VPC = {
    VPCName: "MyBlog-VPC",
    CidrBlock: "10.0.0.0/16",
    PublicSubnetName: "Public",
    PrivateSubnetName: "Private",
  };

  ECS = {
    ClusterName: "MyBlog-ECSCluster",
    NameSpace: "myblog",
    ServiceNameNginx: "MyBlog-ECSService-Nginx",
    ServiceNameStreamlit: "MyBlog-ECSService-Streamlit",
    DiscoveryNameNginx: "nginx-service",
    DiscoveryNameStreamlit: "streamlit-service",
    TaskNameNginx: "MyBlog-ECSTask-Nginx",
    TaskNameStreamlit: "MyBlog-ECSTask-Streamlit",
    TaskRoleName: "MyBlogECSTaskRole",
    TaskExecutionRoleName: "MyBlogECSTaskExecutionRole",
    ContainerLogsName: "MyBlogECSTaskLogs",
    ContainerNginxName: "nginx",
    NginxRepoName: "nginx",
    StreamlitRepoName: "streamlit",
    ALBName: "MyBlog-ALB",
    S3Name: "myblog-alb-access-log",
    ALBSecurityGroupName: "MyBlogALBSG",
    ALBListenerName: "MyBlogALBListener",
    ALBTargetGroupName: "MyBlogALBTargetGroup",
  };
  // Don't use -
  Glue = {
    DatabaseName: "access_log_db",
    AlbTableName: "alb_table",
    CloudFrontTableName: "cloudfront_table",
    AthenaBucketName: "alb-access-log-athena-query",
    WorkGroupName: "alb_access_log",
    CloudFrontS3BucketURILog: "s3://myblog-cloudfront-logs/",
  };
}
