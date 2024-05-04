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
    ServiceName: "MyBlog-ECSService",
    TaskName: "MyBlog-ECSTask",
    ContainerLogsName: "MyBlogECSTaskLogs",
    ContainerNginxName: "nginx",
    NginxRepoName: "nginx",
    StreamlitRepoName: "streamlit",
    ALBName: "MyBlog-ALB",
    ALBSecurityGroupName: "MyBlogALBSG",
    ALBListenerName: "MyBlogALBListener",
    ALBTargetGroupName: "MyBlogALBTargetGroup",
  };
}
