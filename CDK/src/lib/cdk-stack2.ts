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
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
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
      directory: path.join(__dirname, "../../docker/nginx"),
    });
    const streamlitRepo = new DockerImageAsset(this, param.ECS.StreamlitRepoName, {
      directory: path.join(__dirname, "../../docker/streamlit"),
    });
    const cluster = new ecs.Cluster(this, param.ECS.ClusterName, {
      vpc: vpc,
      clusterName: param.ECS.ClusterName,
      executeCommandConfiguration: {
        logging: ecs.ExecuteCommandLogging.NONE,
      },
    });
    const namespace = cluster.addDefaultCloudMapNamespace({
      name: param.ECS.NameSpace,
      useForServiceConnect: true,
    });
    const ecsLogs = new logs.LogGroup(this, param.ECS.ContainerLogsName, {
      logGroupName: param.ECS.ContainerLogsName,
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const taskRole = new iam.Role(this, param.ECS.TaskRoleName, {
      roleName: param.ECS.TaskRoleName,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccessV2"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXrayFullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")],
      inlinePolicies: {
        inlinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["ssmmessages:*", "secretsmanager:*"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });
    // const taskExecutionRole = new iam.Role(this, param.ECS.TaskExecutionRoleName, {
    //   roleName: param.ECS.TaskExecutionRoleName,
    //   assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    //   managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")],
    //   inlinePolicies: {
    //     inlinePolicy: new iam.PolicyDocument({
    //       statements: [
    //         new iam.PolicyStatement({
    //           effect: iam.Effect.ALLOW,
    //           actions: ["ecr:*", "logs:*"],
    //           resources: ["*"],
    //         }),
    //       ],
    //     }),
    //   },
    // });
    const taskNginx = new ecs.FargateTaskDefinition(this, param.ECS.TaskNameNginx, {
      family: param.ECS.TaskNameNginx,
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole: taskRole,
      // executionRole: taskExecutionRole,
    });
    const taskStreamlit = new ecs.FargateTaskDefinition(this, param.ECS.TaskNameStreamlit, {
      family: param.ECS.TaskNameStreamlit,
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole: taskRole,
      // executionRole: taskExecutionRole,
      volumes: [
        {
          name: param.ECS.MountPointName,
        },
      ],
    });
    taskNginx.addContainer("nginx", {
      image: ecs.ContainerImage.fromDockerImageAsset(nginxRepo),
      portMappings: [
        {
          name: "nginx",
          containerPort: 80,
          // protocol: ecs.Protocol.TCP,
          // appProtocol: ecs.AppProtocol.http,
        },
      ],
      containerName: "nginx",
      healthCheck: {
        command: ["CMD-SHELL", "curl -f http://127.0.0.1/streamlit >> /proc/1/fd/1 2>&1 || exit 1"],
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(30),
        retries: 3,
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "nginx",
        logGroup: ecsLogs,
      }),
      // environment: {
      //   streamlithost: param.ECS.DiscoveryNameStreamlit + "." + param.ECS.NameSpace,
      // },
    });
    const streamlit_container = taskStreamlit.addContainer("streamlit", {
      image: ecs.ContainerImage.fromDockerImageAsset(streamlitRepo),
      portMappings: [
        {
          name: "streamlit",
          containerPort: 8501,
          // protocol: ecs.Protocol.TCP,
          // appProtocol: ecs.AppProtocol.http,
        },
      ],
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
      environment: {
        PYTHONPATH: "/otel-auto-instrumentation-python/opentelemetry/instrumentation/auto_instrumentation:/app/code/:/otel-auto-instrumentation-python",
        OTEL_EXPORTER_OTLP_PROTOCOL: "http/protobuf",
        OTEL_TRACES_SAMPLER: "xray",
        OTEL_TRACES_SAMPLER_ARG: "endpoint=http://localhost:2000",
        OTEL_LOGS_EXPORTER: "none",
        OTEL_PYTHON_DISTRO: "aws_distro",
        OTEL_PYTHON_CONFIGURATOR: "aws_configurator",
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "http://localhost:4316/v1/traces",
        OTEL_AWS_APPLICATION_SIGNALS_EXPORTER_ENDPOINT: "http://localhost:4316/v1/metrics",
        OTEL_METRICS_EXPORTER: "none",
        OTEL_AWS_APPLICATION_SIGNALS_ENABLED: "true",
        OTEL_RESOURCE_ATTRIBUTES: "aws.hostedin.environment=streamlit-service,service.name=streamlit",
      },
    });
    streamlit_container.addMountPoints({
      readOnly: false,
      sourceVolume: param.ECS.MountPointName,
      containerPath: "/otel-auto-instrumentation-python",
    });
    taskNginx.addContainer("xray-daemon", {
      containerName: "xray-daemon",
      image: ecs.ContainerImage.fromRegistry("public.ecr.aws/xray/aws-xray-daemon:latest"),
      // image: ecs.ContainerImage.fromRegistry("public.ecr.aws/xray/aws-xray-daemon:3.3.12"),
      command: ["--local-mode"],
      cpu: 32,
      memoryReservationMiB: 256,
      portMappings: [
        {
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        },
      ],
      healthCheck: {
        command: ["CMD", "/xray", "--version", "||", "exit 1"],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "xray",
        logGroup: ecsLogs,
      }),
    });
    taskStreamlit.addContainer("xray-daemon", {
      containerName: "xray-daemon",
      image: ecs.ContainerImage.fromRegistry("public.ecr.aws/xray/aws-xray-daemon:latest"),
      // image: ecs.ContainerImage.fromRegistry("public.ecr.aws/xray/aws-xray-daemon:3.3.12"),
      command: ["--local-mode"],
      cpu: 32,
      memoryReservationMiB: 256,
      portMappings: [
        {
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        },
      ],
      healthCheck: {
        command: ["CMD", "/xray", "--version", "||", "exit 1"],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "xray",
        logGroup: ecsLogs,
      }),
    });
    const secret = new secretsmanager.Secret(this, param.ECS.SecretName, {
      secretName: param.ECS.SecretName,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          traces: {
            traces_collected: {
              app_signals: {},
            },
          },
          logs: {
            metrics_collected: {
              app_signals: {},
            },
          },
        }),
        generateStringKey: "unused-key",
      },
    });
    taskStreamlit.addContainer("ecs-cwagent", {
      containerName: "ecs-cwagent",
      image: ecs.ContainerImage.fromRegistry("public.ecr.aws/cloudwatch-agent/cloudwatch-agent:latest"),
      secrets: {
        CW_CONFIG_CONTENT: ecs.Secret.fromSecretsManager(secret),
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "ecs-cwagent",
        logGroup: ecsLogs,
      }),
    });
    // https://docs.aws.amazon.com/ja_jp/AmazonCloudWatch/latest/monitoring/CloudWatch-Application-Signals-Enable-ECS.html
    const init_container = taskStreamlit.addContainer("init", {
      containerName: "init",
      image: ecs.ContainerImage.fromRegistry("public.ecr.aws/aws-observability/adot-autoinstrumentation-python:v0.1.1"),
      command: ["cp", "-a", "/autoinstrumentation/.", "/otel-auto-instrumentation-python"],
      essential: false,
    });
    init_container.addMountPoints({
      readOnly: false,
      sourceVolume: param.ECS.MountPointName,
      containerPath: "/otel-auto-instrumentation-python",
    });
    const serviceNginx = new ecs.FargateService(this, param.ECS.ServiceNameNginx, {
      cluster: cluster,
      taskDefinition: taskNginx,
      serviceName: param.ECS.ServiceNameNginx,
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
      serviceConnectConfiguration: {
        services: [
          {
            portMappingName: "nginx", // portMappingのnameに合わせる
            discoveryName: param.ECS.DiscoveryNameNginx, // このサービスにアクセスする際の名前
            port: 80,
            // dnsName: "ng" // alias name
          },
        ],
        logDriver: ecs.LogDriver.awsLogs({
          streamPrefix: "service-connect-nginx",
          logGroup: ecsLogs,
        }),
      },
    });
    serviceNginx.node.addDependency(namespace); // namespaceが作成された後に作成されるよう依存関係を設定する必要がある
    const serviceStreamlit = new ecs.FargateService(this, param.ECS.ServiceNameStreamlit, {
      cluster: cluster,
      taskDefinition: taskStreamlit,
      serviceName: param.ECS.ServiceNameStreamlit,
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
      serviceConnectConfiguration: {
        services: [
          {
            portMappingName: "streamlit",
            discoveryName: param.ECS.DiscoveryNameStreamlit,
            port: 8501,
          },
        ],
        logDriver: ecs.LogDriver.awsLogs({
          streamPrefix: "service-connect-streamlit",
          logGroup: ecsLogs,
        }),
      },
    });
    serviceStreamlit.node.addDependency(namespace);
    serviceStreamlit.connections.allowFrom(serviceNginx, ec2.Port.tcp(8501));
    const scalingNginx = serviceNginx.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });
    scalingNginx.scaleOnCpuUtilization("CpuScalingNginx", {
      targetUtilizationPercent: 85,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
    const scalingStreamlit = serviceStreamlit.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });
    scalingStreamlit.scaleOnCpuUtilization("CpuScalingStreamlit", {
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
    // const albS3Logs = new s3.Bucket(this, param.ECS.S3Name, {
    //   bucketName: param.ECS.S3Name,
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    //   autoDeleteObjects: true,
    //   lifecycleRules: [
    //     {
    //       enabled: true,
    //       expiration: Duration.days(1),
    //     },
    //   ],
    // });

    const certificateArn = "";
    const certificate = certmgr.Certificate.fromCertificateArn(this, "MyBlogCertificate", certificateArn);
    const listener443 = alb.addListener(param.ECS.ALBTargetGroupName, {
      port: 443,
      certificates: [certificate],
      sslPolicy: elbv2.SslPolicy.TLS12, // CloudFrontは最新のTLS1.3に対応していない
    });
    listener443.addTargets(param.ECS.ALBTargetGroupName, {
      port: 80,
      targets: [serviceNginx],
      healthCheck: {
        protocol: elbv2.Protocol.HTTP,
        port: "80",
        path: "/",
        enabled: true,
        healthyHttpCodes: "200",
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(5),
      },
      stickinessCookieDuration: Duration.days(1),
    });
    // https://docs.aws.amazon.com/ja_jp/elasticloadbalancing/latest/APIReference/API_LoadBalancerAttribute.html
    // AccessLogs & ConnectionLogs
    // alb.logAccessLogs(albS3Logs);
    // alb.setAttribute("connection_logs.s3.enabled", "true");
    // alb.setAttribute("connection_logs.s3.bucket", albS3Logs.bucketName);

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
    // const glueDatabase = new glue.CfnDatabase(this, param.Glue.DatabaseName, {
    //   catalogId: accountId,
    //   databaseInput: {
    //     name: param.Glue.DatabaseName,
    //   },
    // });
    // const glueAlbTable = new glue.CfnTable(this, param.Glue.AlbTableName, {
    //   catalogId: accountId,
    //   databaseName: glueDatabase.ref,
    //   tableInput: {
    //     name: param.Glue.AlbTableName,
    //     tableType: "EXTERNAL_TABLE",
    //     parameters: {
    //       "projection.enabled": "true",
    //       "projection.date.type": "date",
    //       "projection.date.range": "NOW-1YEARS, NOW",
    //       "projection.date.format": "yyyy/MM/dd",
    //       "projection.date.interval": "1",
    //       "projection.date.interval.unit": "DAYS",
    //       "projection.region.type": "enum",
    //       "projection.region.values": "af-south-1,ap-east-1,ap-northeast-1,ap-northeast-2,ap-northeast-3,ap-south-1,ap-southeast-1,ap-southeast-2,ca-central-1,eu-central-1,eu-north-1,eu-south-1,eu-west-1,eu-west-2,eu-west-3,me-south-1,sa-east-1,us-east-1,us-east-2,us-west-1,us-west-2",
    //       "storage.location.template": `s3://${param.ECS.S3Name}/AWSLogs/${accountId}/elasticloadbalancing/` + "${region}/${date}/",
    //     },
    //     partitionKeys: [
    //       {
    //         name: "date",
    //         type: "string",
    //       },
    //       {
    //         name: "region",
    //         type: "string",
    //       },
    //     ],
    //     storageDescriptor: {
    //       columns: [
    //         { name: "type", type: "string" },
    //         { name: "time", type: "string" },
    //         { name: "elb", type: "string" },
    //         { name: "client_ip", type: "string" },
    //         { name: "client_port", type: "int" },
    //         { name: "target_ip", type: "string" },
    //         { name: "target_port", type: "int" },
    //         { name: "request_processing_time", type: "double" },
    //         { name: "target_processing_time", type: "double" },
    //         { name: "response_processing_time", type: "double" },
    //         { name: "elb_status_code", type: "int" },
    //         { name: "target_status_code", type: "string" },
    //         { name: "received_bytes", type: "bigint" },
    //         { name: "sent_bytes", type: "bigint" },
    //         { name: "request_verb", type: "string" },
    //         { name: "request_url", type: "string" },
    //         { name: "request_proto", type: "string" },
    //         { name: "user_agent", type: "string" },
    //         { name: "ssl_cipher", type: "string" },
    //         { name: "ssl_protocol", type: "string" },
    //         { name: "target_group_arn", type: "string" },
    //         { name: "trace_id", type: "string" },
    //         { name: "domain_name", type: "string" },
    //         { name: "chosen_cert_arn", type: "string" },
    //         { name: "matched_rule_priority", type: "string" },
    //         { name: "request_creation_time", type: "string" },
    //         { name: "actions_executed", type: "string" },
    //         { name: "redirect_url", type: "string" },
    //         { name: "lambda_error_reason", type: "string" },
    //         { name: "target_port_list", type: "string" },
    //         { name: "target_status_code_list", type: "string" },
    //         { name: "classification", type: "string" },
    //         { name: "classification_reason", type: "string" },
    //       ],
    //       location: `s3://${param.ECS.S3Name}/AWSLogs/${accountId}/elasticloadbalancing/`,
    //       inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
    //       outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
    //       serdeInfo: {
    //         serializationLibrary: "org.apache.hadoop.hive.serde2.RegexSerDe",
    //         parameters: {
    //           "serialization.format": "1",
    //           "input.regex": '([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*):([0-9]*) ([^ ]*)[:-]([0-9]*) ([-.0-9]*) ([-.0-9]*) ([-.0-9]*) (|[-0-9]*) (-|[-0-9]*) ([-0-9]*) ([-0-9]*) "([^ ]*) (.*) (- |[^ ]*)" "([^"]*)" ([A-Z0-9-_]+) ([A-Za-z0-9.-]*) ([^ ]*) "([^"]*)" "([^"]*)" "([^"]*)" ([-.0-9]*) ([^ ]*) "([^"]*)" "([^"]*)" "([^ ]*)" "([^s]+?)" "([^s]+)" "([^ ]*)" "([^ ]*)"',
    //         },
    //       },
    //     },
    //   },
    // });
    // const glueCloudFrontTable = new glue.CfnTable(this, param.Glue.CloudFrontTableName, {
    //   catalogId: accountId,
    //   databaseName: glueDatabase.ref,
    //   tableInput: {
    //     name: param.Glue.CloudFrontTableName,
    //     tableType: "EXTERNAL_TABLE",
    //     parameters: {
    //       "skip.header.line.count": "2",
    //     },
    //     storageDescriptor: {
    //       columns: [
    //         { name: "date", type: "DATE" },
    //         { name: "time", type: "STRING" },
    //         { name: "x_edge_location", type: "STRING" },
    //         { name: "sc_bytes", type: "BIGINT" },
    //         { name: "c_ip", type: "STRING" },
    //         { name: "cs_method", type: "STRING" },
    //         { name: "cs_host", type: "STRING" },
    //         { name: "cs_uri_stem", type: "STRING" },
    //         { name: "sc_status", type: "INT" },
    //         { name: "cs_referrer", type: "STRING" },
    //         { name: "cs_user_agent", type: "STRING" },
    //         { name: "cs_uri_query", type: "STRING" },
    //         { name: "cs_cookie", type: "STRING" },
    //         { name: "x_edge_result_type", type: "STRING" },
    //         { name: "x_edge_request_id", type: "STRING" },
    //         { name: "x_host_header", type: "STRING" },
    //         { name: "cs_protocol", type: "STRING" },
    //         { name: "cs_bytes", type: "BIGINT" },
    //         { name: "time_taken", type: "FLOAT" },
    //         { name: "x_forwarded_for", type: "STRING" },
    //         { name: "ssl_protocol", type: "STRING" },
    //         { name: "ssl_cipher", type: "STRING" },
    //         { name: "x_edge_response_result_type", type: "STRING" },
    //         { name: "cs_protocol_version", type: "STRING" },
    //         { name: "fle_status", type: "STRING" },
    //         { name: "fle_encrypted_fields", type: "INT" },
    //         { name: "c_port", type: "INT" },
    //         { name: "time_to_first_byte", type: "FLOAT" },
    //         { name: "x_edge_detailed_result_type", type: "STRING" },
    //         { name: "sc_content_type", type: "STRING" },
    //         { name: "sc_content_len", type: "BIGINT" },
    //         { name: "sc_range_start", type: "BIGINT" },
    //         { name: "sc_range_end", type: "BIGINT" },
    //       ],
    //       location: param.Glue.CloudFrontS3BucketURILog,
    //       inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
    //       outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
    //       serdeInfo: {
    //         serializationLibrary: "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe",
    //         parameters: {
    //           "serialization.format": "\t",
    //         },
    //       },
    //     },
    //   },
    // });
    // const athenaS3Logs = new s3.Bucket(this, param.Glue.AthenaBucketName, {
    //   bucketName: param.Glue.AthenaBucketName,
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    //   autoDeleteObjects: true,
    //   lifecycleRules: [
    //     {
    //       enabled: true,
    //       expiration: Duration.days(1),
    //     },
    //   ],
    // });
    // const workGroup = new athena.CfnWorkGroup(this, param.Glue.WorkGroupName, {
    //   name: param.Glue.WorkGroupName,
    //   recursiveDeleteOption: true,
    //   state: "ENABLED",
    //   workGroupConfiguration: {
    //     bytesScannedCutoffPerQuery: 100000000000,
    //     resultConfiguration: {
    //       expectedBucketOwner: accountId,
    //       outputLocation: `s3://${param.Glue.AthenaBucketName}/`,
    //     },
    //   },
    // });
  }
}
