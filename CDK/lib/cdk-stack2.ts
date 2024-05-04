import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
// import * as ecr from "aws-cdk-lib/aws-ecr";
import * as logs from "aws-cdk-lib/aws-logs";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as certmgr from "aws-cdk-lib/aws-certificatemanager";
import * as path from "path";

import { MyBlogParam2 } from "./parameters2";
import { Certificate } from "crypto";

const param = new MyBlogParam2();

export class MyBlogStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, param.VPC.VPCName, {
      vpcName: param.VPC.VPCName,
      ipAddresses: ec2.IpAddresses.cidr(param.VPC.CidrBlock),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: param.VPC.PublicSubnetName,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: param.VPC.PrivateSubnetName,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
    const nginxRepo = new DockerImageAsset(this, param.ECS.NginxRepoName, {
      directory: path.join(__dirname, "./docker/nginx"),
    });
    const streamlitRepo = new DockerImageAsset(
      this,
      param.ECS.StreamlitRepoName,
      {
        directory: path.join(__dirname, "./docker/streamlit"),
      }
    );
    const cluster = new ecs.Cluster(this, param.ECS.ClusterName, {
      vpc: vpc,
      clusterName: param.ECS.ClusterName,
      executeCommandConfiguration: {
        logging: ecs.ExecuteCommandLogging.NONE,
      },
    });
    const ecsLogs = new logs.LogGroup(this, param.ECS.ContainerLogsName, {
      logGroupName: param.ECS.ContainerLogsName,
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const task = new ecs.FargateTaskDefinition(this, param.ECS.TaskName, {
      family: param.ECS.TaskName,
      cpu: 256,
      memoryLimitMiB: 512,
    });
    task.addContainer("nginx", {
      image: ecs.ContainerImage.fromDockerImageAsset(nginxRepo),
      portMappings: [{ containerPort: 80 }],
      containerName: "nginx",
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://127.0.0.1/streamlit:80 >> /proc/1/fd/1 2>&1  || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "nginx",
        logGroup: ecsLogs,
      }),
    });
    task.addContainer("streamlit", {
      image: ecs.ContainerImage.fromDockerImageAsset(streamlitRepo),
      portMappings: [{ containerPort: 8080 }],
      containerName: "streamlit",
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://127.0.0.1:8080/_stcore/health >> /proc/1/fd/1 2>&1  || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "streamlit",
        logGroup: ecsLogs,
      }),
    });
    const service = new ecs.FargateService(this, param.ECS.ServiceName, {
      cluster: cluster,
      taskDefinition: task,
      serviceName: param.ECS.ServiceName,
      assignPublicIp: true,
      enableExecuteCommand: true,
      desiredCount: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE_SPOT",
          weight: 1,
        },
        {
          capacityProvider: "FARGATE",
          weight: 0,
        },
      ],
    });
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 85,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
    const albSG = new ec2.SecurityGroup(this, param.ECS.ALBSecurityGroupName, {
      vpc,
      securityGroupName: param.ECS.ALBSecurityGroupName,
    });
    albSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));
    const alb = new elbv2.ApplicationLoadBalancer(this, param.ECS.ALBName, {
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: albSG,
      internetFacing: true,
      loadBalancerName: param.ECS.ALBName,
    });
    // const listener80 = alb.addListener(param.ECS.ALBListenerName, {
    //   port: 80,
    // });
    // listener80.addTargets(param.ECS.ALBTargetGroupName, {
    //   port: 80,
    //   targets: [service],
    // });
    const certificateArn =
      "";
    const certificate = certmgr.Certificate.fromCertificateArn(
      this,
      "MyBlogCertificate",
      certificateArn
    );
    const listener443 = alb.addListener(param.ECS.ALBTargetGroupName, {
      port: 443,
      certificates: [certificate],
      sslPolicy: elbv2.SslPolicy.TLS13_13,
    });
    listener443.addTargets(param.ECS.ALBTargetGroupName, {
      port: 80,
      targets: [service],
      healthCheck: {
        protocol: elbv2.Protocol.HTTP,
        port: "80",
        path: "/",
        enabled: true,
        healthyHttpCodes: "200",
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
        interval: cdk.Duration.seconds(20),
        timeout: cdk.Duration.seconds(5),
      },
    });
  }
}
