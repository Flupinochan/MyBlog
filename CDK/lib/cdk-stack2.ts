import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
// import * as ecr from "aws-cdk-lib/aws-ecr";
import * as logs from "aws-cdk-lib/aws-logs";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as certmgr from "aws-cdk-lib/aws-certificatemanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";
import { Duration } from "aws-cdk-lib";
import { aws_glue as glue } from "aws-cdk-lib";
import { aws_athena as athena } from "aws-cdk-lib";

import { MyBlogParam2 } from "./parameters2";
import { Certificate } from "crypto";

const param = new MyBlogParam2();

export class MyBlogStack2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = String(cdk.Stack.of(this).account);

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
    const streamlitRepo = new DockerImageAsset(this, param.ECS.StreamlitRepoName, {
      directory: path.join(__dirname, "./docker/streamlit"),
    });
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
        command: ["CMD-SHELL", "curl -f http://127.0.0.1/streamlit >> /proc/1/fd/1 2>&1 || exit 1"],
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
      portMappings: [{ containerPort: 8501 }],
      containerName: "streamlit",
      healthCheck: {
        command: ["CMD-SHELL", "curl -f http://127.0.0.1:8501/_stcore/health >> /proc/1/fd/1 2>&1  || exit 1"],
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
      circuitBreaker: {
        rollback: true,
      },
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
      crossZoneEnabled: true,
      http2Enabled: true,
    });
    const albS3Logs = new s3.Bucket(this, param.ECS.S3Name, {
      bucketName: param.ECS.S3Name,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(1),
        },
      ],
    });
    // connection logは、コンソールから設定する
    alb.logAccessLogs(albS3Logs);
    const certificateArn = ""; // \MyBlog\.git\hooks\pre-commit"
    const certificate = certmgr.Certificate.fromCertificateArn(this, "MyBlogCertificate", certificateArn);
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
      stickinessCookieDuration: Duration.days(1),
    });

    // const glueCatalog = new glue.CfnDataCatalogEncryptionSettings(
    //   this,
    //   "AlbAccessLog",
    //   {
    //     catalogId: accountId,
    //     dataCatalogEncryptionSettings: {
    //       connectionPasswordEncryption: {
    //         returnConnectionPasswordEncrypted: false,
    //       },
    //     },
    //   }
    // );
    const glueDatabase = new glue.CfnDatabase(this, param.Glue.DatabaseName, {
      catalogId: accountId,
      databaseInput: {
        name: param.Glue.DatabaseName,
      },
    });
    const glueTable = new glue.CfnTable(this, param.Glue.TableName, {
      catalogId: accountId,
      databaseName: glueDatabase.ref,
      tableInput: {
        name: param.Glue.TableName,
        tableType: "EXTERNAL_TABLE",
        parameters: {
          "projection.enabled": "true",
          "projection.date.type": "date",
          "projection.date.range": "NOW-1YEARS, NOW",
          "projection.date.format": "yyyy/MM/dd",
          "projection.date.interval": "1",
          "projection.date.interval.unit": "DAYS",
          "projection.region.type": "enum",
          "projection.region.values": "af-south-1,ap-east-1,ap-northeast-1,ap-northeast-2,ap-northeast-3,ap-south-1,ap-southeast-1,ap-southeast-2,ca-central-1,eu-central-1,eu-north-1,eu-south-1,eu-west-1,eu-west-2,eu-west-3,me-south-1,sa-east-1,us-east-1,us-east-2,us-west-1,us-west-2",
          "storage.location.template": `s3://${param.ECS.S3Name}/AWSLogs/${accountId}/elasticloadbalancing/` + "${region}/${date}/",
        },
        partitionKeys: [
          {
            name: "date",
            type: "string",
          },
          {
            name: "region",
            type: "string",
          },
        ],
        storageDescriptor: {
          columns: [
            { name: "type", type: "string" },
            { name: "time", type: "string" },
            { name: "elb", type: "string" },
            { name: "client_ip", type: "string" },
            { name: "client_port", type: "int" },
            { name: "target_ip", type: "string" },
            { name: "target_port", type: "int" },
            { name: "request_processing_time", type: "double" },
            { name: "target_processing_time", type: "double" },
            { name: "response_processing_time", type: "double" },
            { name: "elb_status_code", type: "int" },
            { name: "target_status_code", type: "string" },
            { name: "received_bytes", type: "bigint" },
            { name: "sent_bytes", type: "bigint" },
            { name: "request_verb", type: "string" },
            { name: "request_url", type: "string" },
            { name: "request_proto", type: "string" },
            { name: "user_agent", type: "string" },
            { name: "ssl_cipher", type: "string" },
            { name: "ssl_protocol", type: "string" },
            { name: "target_group_arn", type: "string" },
            { name: "trace_id", type: "string" },
            { name: "domain_name", type: "string" },
            { name: "chosen_cert_arn", type: "string" },
            { name: "matched_rule_priority", type: "string" },
            { name: "request_creation_time", type: "string" },
            { name: "actions_executed", type: "string" },
            { name: "redirect_url", type: "string" },
            { name: "lambda_error_reason", type: "string" },
            { name: "target_port_list", type: "string" },
            { name: "target_status_code_list", type: "string" },
            { name: "classification", type: "string" },
            { name: "classification_reason", type: "string" },
          ],
          location: `s3://${param.ECS.S3Name}/AWSLogs/${accountId}/elasticloadbalancing/`,
          inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
          outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
          serdeInfo: {
            serializationLibrary: "org.apache.hadoop.hive.serde2.RegexSerDe",
            parameters: {
              "serialization.format": "1",
              "input.regex": '([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*):([0-9]*) ([^ ]*)[:-]([0-9]*) ([-.0-9]*) ([-.0-9]*) ([-.0-9]*) (|[-0-9]*) (-|[-0-9]*) ([-0-9]*) ([-0-9]*) "([^ ]*) (.*) (- |[^ ]*)" "([^"]*)" ([A-Z0-9-_]+) ([A-Za-z0-9.-]*) ([^ ]*) "([^"]*)" "([^"]*)" "([^"]*)" ([-.0-9]*) ([^ ]*) "([^"]*)" "([^"]*)" "([^ ]*)" "([^s]+?)" "([^s]+)" "([^ ]*)" "([^ ]*)"',
            },
          },
        },
      },
    });
    const athenaS3Logs = new s3.Bucket(this, param.Glue.AthenaBucketName, {
      bucketName: param.Glue.AthenaBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(1),
        },
      ],
    });
    const workGroup = new athena.CfnWorkGroup(this, param.Glue.WorkGroupName, {
      name: param.Glue.WorkGroupName,
      recursiveDeleteOption: true,
      state: "ENABLED",
      workGroupConfiguration: {
        bytesScannedCutoffPerQuery: 100000000000,
        resultConfiguration: {
          expectedBucketOwner: accountId,
          outputLocation: `s3://${param.Glue.AthenaBucketName}/`,
        },
      },
    });
  }
}
