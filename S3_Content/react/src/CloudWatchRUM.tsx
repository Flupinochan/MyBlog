// https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_react.md
// https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md
import { AwsRum, AwsRumConfig } from "aws-rum-web";

let cwr: AwsRum | null = null;
try {
  const config: AwsRumConfig = {
    sessionSampleRate: 1,
    identityPoolId: "us-west-2:a70782e0-77dd-4827-960f-20fd3a84d627",
    endpoint: "https://dataplane.rum.us-west-2.amazonaws.com",
    telemetries: ["performance", "errors", "http"],
    allowCookies: true,
    enableXRay: true,
  };

  const APPLICATION_ID: string = "9bc8a6c1-d424-4bba-a3e4-808a33a1a970";
  const APPLICATION_VERSION: string = "1.0.0";
  const APPLICATION_REGION: string = "us-west-2";

  const awsRum: AwsRum = new AwsRum(APPLICATION_ID, APPLICATION_VERSION, APPLICATION_REGION, config);
  cwr = awsRum;
} catch (error) {
  // Ignore errors thrown during CloudWatch RUM web client initialization
}

export const getRum = () => {
  return cwr;
};
