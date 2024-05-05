#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyBlogStack } from "../lib/cdk-stack";
import { MyBlogStack2 } from "../lib/cdk-stack2";

import { MyBlogParam } from "../lib/parameters";
import { MyBlogParam2 } from "../lib/parameters2";

const param = new MyBlogParam();
const param2 = new MyBlogParam2();

// const app = new cdk.App();
// new MyBlogStack(app, "MyBlogCDK", {
//   env: { region: param.env.region },
// });

const app2 = new cdk.App();
new MyBlogStack2(app2, "MyBlogCDK2", {
  env: { region: param2.env.region },
});
