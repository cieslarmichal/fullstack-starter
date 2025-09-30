import { type PutObjectCommandInput, type S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { type Readable } from 'node:stream';

export interface UploadFilePayload {
  readonly fileId: string;
  readonly data: Readable;
  readonly contentType: string;
  readonly attachmentName?: string;
}

export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  public constructor(s3Client: S3Client, bucketName: string) {
    this.s3Client = s3Client;
    this.bucketName = bucketName;
  }

  public async uploadFile(payload: UploadFilePayload): Promise<void> {
    const { fileId, data, contentType, attachmentName } = payload;

    const putObjectInput: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: fileId,
      Body: data,
      ContentType: contentType,
    };

    if (attachmentName) {
      putObjectInput.ContentDisposition = `attachment; filename=${attachmentName}`;
    }

    const upload = new Upload({
      client: this.s3Client,
      params: putObjectInput,
    });

    await upload.done();
  }
}
