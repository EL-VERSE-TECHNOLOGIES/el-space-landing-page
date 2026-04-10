import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'el-space-uploads';

export interface UploadFileParams {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadedFile {
  url: string;
  key: string;
  bucket: string;
}

export async function uploadFile(params: UploadFileParams): Promise<UploadedFile> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      Metadata: params.metadata,
    });

    await s3Client.send(command);

    return {
      url: `https://${BUCKET_NAME}.s3.amazonaws.com/${params.key}`,
      key: params.key,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

export async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}

/**
 * Upload a portfolio file for a freelancer
 */
export async function uploadPortfolioFile(
  userId: string,
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string
): Promise<UploadedFile> {
  const key = `portfolios/${userId}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
  
  return uploadFile({
    key,
    body: fileBuffer,
    contentType,
    metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  });
}

/**
 * Upload a project deliverable
 */
export async function uploadProjectDeliverable(
  projectId: string,
  milestoneId: string,
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string
): Promise<UploadedFile> {
  const key = `deliverables/${projectId}/${milestoneId}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
  
  return uploadFile({
    key,
    body: fileBuffer,
    contentType,
    metadata: {
      projectId,
      milestoneId,
      uploadedAt: new Date().toISOString(),
    },
  });
}

/**
 * Upload a profile avatar
 */
export async function uploadProfileAvatar(
  userId: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string
): Promise<UploadedFile> {
  const key = `avatars/${userId}/profile-${Date.now()}.${getExtension(contentType)}`;
  
  return uploadFile({
    key,
    body: fileBuffer,
    contentType,
    metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  });
}

/**
 * Upload project images/thumbnail
 */
export async function uploadProjectMedia(
  projectId: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string
): Promise<UploadedFile> {
  const key = `projects/${projectId}/media-${Date.now()}.${getExtension(contentType)}`;
  
  return uploadFile({
    key,
    body: fileBuffer,
    contentType,
    metadata: {
      projectId,
      uploadedAt: new Date().toISOString(),
    },
  });
}

function getExtension(contentType: string): string {
  const extensionMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };
  
  return extensionMap[contentType] || 'bin';
}
