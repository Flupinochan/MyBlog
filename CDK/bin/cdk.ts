#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyBlogStack } from "../lib/cdk-stack";

import { MyBlogParam } from "../lib/parameters";

const param = new MyBlogParam();

const app = new cdk.App();
new MyBlogStack(app, "MyBlogCDK", {
  env: { region: param.env.region },
});
