#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyBlogStack } from "../lib/cdk-stack";
import { MyBlogStack2 } from "../lib/cdk-stack2";
import { MyBlogStack3 } from "../lib/cdk-stack3";

import { MyBlogParam } from "../lib/parameters";
import { MyBlogParam2 } from "../lib/parameters2";
import { MyBlogParam3 } from "../lib/parameters3";

// https://pages.awscloud.com/rs/112-TZM-766/images/AWS-Black-Belt_2023_AWS-CDK-Basic-2-Features_0831_v1.pdf
const param = new MyBlogParam();
const param2 = new MyBlogParam2();
const param3 = new MyBlogParam3();

const app = new cdk.App();
new MyBlogStack(app, "MyBlogCDK", {
  env: { region: param.env.region },
});

new MyBlogStack2(app, "MyBlogCDK2", {
  env: { region: param2.env.region },
});

new MyBlogStack3(app, "MyBlogCDK3", {
  env: { region: param3.env.region },
});
