import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

// The AWS client lives in config because storage credentials are infrastructure
// concerns; services only decide when and why to store a resume.
export const s3Client = new S3Client({
  region: env.awsRegion,
  credentials:
    env.awsAccessKeyId && env.awsSecretAccessKey
      ? {
          accessKeyId: env.awsAccessKeyId,
          secretAccessKey: env.awsSecretAccessKey,
        }
      : undefined,
});
