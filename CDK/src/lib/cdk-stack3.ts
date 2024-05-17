import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { MyBlogParam3 } from "./parameters3";

const param = new MyBlogParam3();

export class MyBlogStack3 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
