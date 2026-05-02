import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { Express } from "express";
import { env } from "../config/env.js";
import { s3Client } from "../config/s3.js";

type UploadResumeInput = {
  file?: Express.Multer.File;
  userId: string;
};

type ResumeUpload = {
  resumeUrl: string;
  resumeKey: string;
  resumeOriginalName: string;
  resumeContentType: string;
};

export const uploadResumeToS3 = async ({ file, userId }: UploadResumeInput): Promise<ResumeUpload> => {
  if (!file) {
    const error = new Error("Resume file is required");
    error.statusCode = 400;
    throw error;
  }

  if (!env.awsS3Bucket) {
    throw new Error("AWS_S3_BUCKET is required for resume uploads");
  }

  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `resumes/${userId}/${Date.now()}-${safeName}`;

  // Managed upload handles retries and multipart details, which keeps storage
  // robustness outside controllers.
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: env.awsS3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  await upload.done();
  return {
    resumeUrl: `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`,
    resumeKey: key,
    resumeOriginalName: file.originalname,
    resumeContentType: file.mimetype,
  };
};

export const getResumeFromS3 = async ({ key }: { key: string }) => {
  if (!env.awsS3Bucket) {
    throw new Error("AWS_S3_BUCKET is required for resume downloads");
  }

  const command = new GetObjectCommand({
    Bucket: env.awsS3Bucket,
    Key: key,
  });

  return s3Client.send(command);
};
